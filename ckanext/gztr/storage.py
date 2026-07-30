"""S3-backed adapter for the ``gztr`` file storage.

ckanext-file-keeper-cloud supplies the S3 plumbing for CKAN's ``ckan.files``
subsystem. Its released 0.0.1 streams file content through CKAN, but later
revisions answer a download with a redirect to a presigned S3 URL instead. The
gazetteer widgets fetch ``config.json`` and each GeoJSON with ``fetch()`` from
the portal's own origin, and following a cross-origin redirect would require a
CORS policy on the bucket. This adapter pins the streaming behaviour so that an
upgrade of ckanext-file-keeper-cloud cannot change how the widgets load data.

The adapter is registered only when ckanext-file-keeper-cloud and boto3 are both
installed. A filesystem-backed ``gztr`` storage (``ckan:fs``) needs neither, so
the import failure is not an error.
"""

import logging

log = logging.getLogger(__name__)

try:
    from ckanext.file_keeper_cloud.adapters.s3 import S3Storage as CloudS3Storage
    from file_keeper.default.adapters import s3
except ImportError:
    log.debug(
        "ckanext-file-keeper-cloud is not installed, "
        "the gztr:s3 storage adapter is unavailable"
    )

    S3Storage = None
else:
    from ckan.lib.files import base

    class S3Storage(CloudS3Storage):
        """Store gazetteer files in S3, streamed through CKAN.

        Configure it like any other storage, for example::

            ckan.files.storage.gztr.type = gztr:s3
            ckan.files.storage.gztr.bucket = my-bucket
            ckan.files.storage.gztr.path = gztr
            ckan.files.storage.gztr.region = us-east-1
            ckan.files.storage.gztr.key = <AWS access key>
            ckan.files.storage.gztr.secret = <AWS secret key>
            ckan.files.storage.gztr.public = true
        """

        # Replaces the redirecting reader from ckanext-file-keeper-cloud. The
        # streaming `response` comes from base.Reader, and `capabilities`
        # resolves to s3.Reader's, which includes STREAM.
        ReaderFactory = type("Reader", (base.Reader, s3.Reader), {})
