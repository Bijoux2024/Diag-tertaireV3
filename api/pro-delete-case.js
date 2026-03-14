const ORGANIZATION_ASSETS_BUCKET = 'organization-assets';
const { getRequiredServerSupabaseConfig } = require('./_lib/supabase-server');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const safeJsonParse = (value) => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const asPlainObject = (value) => {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
};

const asArray = (value) => Array.isArray(value) ? value : [];

const encodeQueryValue = (value) => encodeURIComponent(String(value ?? ''));

const encodeStoragePath = (path) => String(path || '')
  .split('/')
  .map((segment) => encodeURIComponent(segment))
  .join('/');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createRestHeaders = (serviceKey, extraHeaders = {}) => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  ...extraHeaders
});

const supabaseRestFetch = async (supabaseUrl, serviceKey, path, options = {}) => {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: createRestHeaders(serviceKey, options.headers || {}),
    body: options.body
  });

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok) {
    const message = data?.message || data?.error_description || rawText || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const fetchAuthUser = async (supabaseUrl, publishableKey, accessToken) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: publishableKey,
      Authorization: `Bearer ${accessToken}`
    }
  });

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (!response.ok || !data?.id) {
    const message = data?.message || data?.error_description || rawText || 'Unauthorized';
    throw createHttpError(401, message);
  }

  return data;
};

const normalizeDeletionResult = (value) => {
  const payload = asPlainObject(value);
  const files = asArray(payload.files).map((entry) => {
    const file = asPlainObject(entry);
    return {
      id: file.id || null,
      kind: file.kind || '',
      bucketName: file.bucket_name || ORGANIZATION_ASSETS_BUCKET,
      storagePath: String(file.storage_path || '').trim()
    };
  }).filter((file) => file.id || file.storagePath);

  return {
    organizationId: payload.organization_id || null,
    caseId: payload.case_id || null,
    deletedReportIds: asArray(payload.report_ids).map((id) => String(id || '').trim()).filter(Boolean),
    organizationFileIds: asArray(payload.organization_file_ids).map((id) => String(id || '').trim()).filter(Boolean),
    storagePaths: asArray(payload.storage_paths).map((path) => String(path || '').trim()).filter(Boolean),
    files
  };
};

const validateStorageCleanupTarget = ({
  organizationId,
  bucketName,
  storagePath
}) => {
  const normalizedOrganizationId = String(organizationId || '').trim();
  const normalizedBucketName = String(bucketName || ORGANIZATION_ASSETS_BUCKET).trim() || ORGANIZATION_ASSETS_BUCKET;
  const normalizedStoragePath = String(storagePath || '').trim();

  if (!normalizedOrganizationId) {
    return {
      ok: false,
      message: 'Missing organization scope for storage cleanup'
    };
  }

  if (normalizedBucketName !== ORGANIZATION_ASSETS_BUCKET) {
    return {
      ok: false,
      message: 'Storage cleanup bucket is outside the allowed scope'
    };
  }

  const expectedPrefix = `org/${normalizedOrganizationId}/reports/`;
  if (!normalizedStoragePath.startsWith(expectedPrefix)) {
    return {
      ok: false,
      message: 'Storage cleanup path is outside the authenticated organization report scope'
    };
  }

  return {
    ok: true,
    bucketName: normalizedBucketName,
    storagePath: normalizedStoragePath
  };
};

const deleteStorageObject = async ({
  supabaseUrl,
  serviceKey,
  bucketName,
  storagePath
}) => {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucketName}/${encodeStoragePath(storagePath)}`,
    {
      method: 'DELETE',
      headers: createRestHeaders(serviceKey)
    }
  );

  const rawText = await response.text();
  const data = rawText ? safeJsonParse(rawText) : null;

  if (response.ok) {
    return {
      ok: true,
      alreadyMissing: false
    };
  }

  const message = data?.message || data?.error || rawText || `HTTP ${response.status}`;
  if (response.status === 404 || /not found/i.test(message)) {
    return {
      ok: true,
      alreadyMissing: true
    };
  }

  return {
    ok: false,
    message
  };
};

const updateOrganizationFilesStatus = async ({
  supabaseUrl,
  serviceKey,
  organizationId,
  fileIds,
  status
}) => {
  const uniqueIds = Array.from(new Set(asArray(fileIds).map((id) => String(id || '').trim()).filter(Boolean)));
  if (!uniqueIds.length) {
    return;
  }

  let path = `organization_files?id=in.(${uniqueIds.join(',')})`;
  if (organizationId) {
    path += `&organization_id=eq.${encodeQueryValue(organizationId)}`;
  }

  await supabaseRestFetch(
    supabaseUrl,
    serviceKey,
    path,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    }
  );
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const serverSupabaseConfig = getRequiredServerSupabaseConfig();
    const supabaseUrl = serverSupabaseConfig.supabaseUrl;
    const publishableKey = serverSupabaseConfig.supabasePublishableKey;
    const serviceKey = serverSupabaseConfig.serviceKey;

    const authorizationHeader = req.headers.authorization || req.headers.Authorization || '';
    const accessToken = authorizationHeader.startsWith('Bearer ')
      ? authorizationHeader.slice('Bearer '.length).trim()
      : '';

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    const body = safeJsonParse(req.body);
    const caseId = String(body?.case_id || '').trim();
    if (!UUID_REGEX.test(caseId)) {
      return res.status(400).json({ error: 'Invalid case_id' });
    }

    const authUser = await fetchAuthUser(supabaseUrl, publishableKey, accessToken);
    const rpcResult = await supabaseRestFetch(
      supabaseUrl,
      serviceKey,
      'rpc/soft_delete_case_bundle',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_case_id: caseId,
          actor_user_id: authUser.id
        })
      }
    );

    const deletionResult = normalizeDeletionResult(rpcResult);
    const filesNeedingCleanup = deletionResult.files.filter((file) => file.storagePath);
    const cleanupCandidates = filesNeedingCleanup.map((file) => {
      const validation = validateStorageCleanupTarget({
        organizationId: deletionResult.organizationId,
        bucketName: file.bucketName || ORGANIZATION_ASSETS_BUCKET,
        storagePath: file.storagePath
      });

      return {
        file,
        validation
      };
    });

    const rejectedCleanupResults = cleanupCandidates
      .filter((entry) => !entry.validation.ok)
      .map((entry) => ({
        ...entry.file,
        ok: false,
        message: entry.validation.message
      }));

    const cleanupResults = [
      ...rejectedCleanupResults,
      ...await Promise.all(
        cleanupCandidates
          .filter((entry) => entry.validation.ok)
          .map(async (entry) => {
            const result = await deleteStorageObject({
              supabaseUrl,
              serviceKey,
              bucketName: entry.validation.bucketName,
              storagePath: entry.validation.storagePath
            });

            return {
              ...entry.file,
              bucketName: entry.validation.bucketName,
              storagePath: entry.validation.storagePath,
              ...result
            };
          })
      )
    ];

    const fileIdsToFinalize = cleanupResults
      .filter((result) => result.ok && result.id)
      .map((result) => result.id);

    let finalizationError = null;
    if (fileIdsToFinalize.length) {
      try {
        await updateOrganizationFilesStatus({
          supabaseUrl,
          serviceKey,
          organizationId: deletionResult.organizationId,
          fileIds: fileIdsToFinalize,
          status: 'deleted'
        });
      } catch (error) {
        finalizationError = error;
      }
    }

    const pendingCleanupEntries = finalizationError
      ? cleanupResults
      : cleanupResults.filter((result) => !result.ok);

    const finalizedFileIds = finalizationError
      ? []
      : fileIdsToFinalize;

    const pendingCleanupFileIds = pendingCleanupEntries
      .map((entry) => entry.id)
      .filter(Boolean);

    const pendingCleanupPaths = pendingCleanupEntries
      .map((entry) => entry.storagePath)
      .filter(Boolean);

    const storageCleanupStatus = pendingCleanupEntries.length || finalizationError
      ? 'partial'
      : 'complete';

    return res.status(200).json({
      ok: true,
      case_id: deletionResult.caseId || caseId,
      organization_id: deletionResult.organizationId,
      deleted_report_ids: deletionResult.deletedReportIds,
      organization_file_ids: deletionResult.organizationFileIds,
      finalized_file_ids: finalizedFileIds,
      pending_cleanup_file_ids: pendingCleanupFileIds,
      pending_cleanup_paths: pendingCleanupPaths,
      storage_cleanup_status: storageCleanupStatus,
      message: storageCleanupStatus === 'partial'
        ? 'Dossier supprime, nettoyage des fichiers a finaliser.'
        : 'Dossier supprime.',
      cleanup: {
        attempted: filesNeedingCleanup.length,
        finalized: finalizedFileIds.length,
        pending: pendingCleanupPaths.length,
        finalization_error: finalizationError?.message || null
      }
    });
  } catch (error) {
    console.error('[pro-delete-case] Secure case deletion failed:', {
      statusCode: Number.isInteger(error?.statusCode) ? error.statusCode : null,
      message: error?.message || 'Unknown error'
    });

    const message = error?.message || 'Unknown error';
    const statusCode = Number.isInteger(error?.statusCode)
      ? error.statusCode
      : message === 'Missing bearer token'
        ? 401
        : message.includes('Case not found')
          ? 404
          : message.includes('Profile organization not found')
            ? 403
            : 500;

    return res.status(statusCode).json({
      error: 'Secure case deletion failed',
      details: message
    });
  }
};
