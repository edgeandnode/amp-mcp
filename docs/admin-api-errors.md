# Admin API Error Codes

Generated: 2025-11-13T06:15:57.734Z

This document provides comprehensive documentation for all error codes returned by the Amp Admin API.

## Error Response Format

All errors follow a consistent JSON format:

```json
{
  "error_code": "DATASET_NOT_FOUND",
  "error_message": "dataset 'eth_mainnet' version '1.0.0' not found"
}
```

- `error_code`: Stable, machine-readable code in SCREAMING_SNAKE_CASE
## Quick Reference

| Error Code | HTTP Status | Endpoint |
|------------|-------------|----------|
| `METADATA_DB_ERROR` | 500 | /datasets |
| `LIST_ALL_DATASETS_ERROR` | 500 | /datasets |
| `INVALID_PAYLOAD_FORMAT` | 400 | /datasets |
| `INVALID_MANIFEST` | 400 | /datasets |
| `MANIFEST_VALIDATION_ERROR` | 400 | /datasets |
| `MANIFEST_REGISTRATION_ERROR` | 500 | /datasets |
| `MANIFEST_LINKING_ERROR` | 500 | /datasets |
| `VERSION_TAGGING_ERROR` | 500 | /datasets |
| `UNSUPPORTED_DATASET_KIND` | 400 | /datasets |
| `MANIFEST_NOT_FOUND` | 404 | /datasets |
| `STORE_ERROR` | 500 | /datasets |
| `INVALID_PATH` | 400 | /datasets/{namespace}/{name} |
| `UNLINK_DATASET_MANIFESTS_ERROR` | 500 | /datasets/{namespace}/{name} |
| `INVALID_PATH` | 400 | /datasets/{namespace}/{name}/versions |
| `LIST_VERSION_TAGS_ERROR` | 500 | /datasets/{namespace}/{name}/versions |
| `RESOLVE_REVISION_ERROR` | 500 | /datasets/{namespace}/{name}/versions |
| `INVALID_PATH` | 400 | /datasets/{namespace}/{name}/versions/{revision} |
| `INVALID_PATH` | 400 | /datasets/{namespace}/{name}/versions/{revision}/deploy |
| `INVALID_BODY` | 400 | /datasets/{namespace}/{name}/versions/{revision}/deploy |
| `INVALID_PATH` | 400 | /datasets/{namespace}/{name}/versions/{revision}/manifest |
| `INVALID_PATH` | 400 | /datasets/{namespace}/{name}/versions/{version} |
| `RESOLVE_LATEST_REVISION_ERROR` | 500 | /datasets/{namespace}/{name}/versions/{version} |
| `RESOLVE_VERSION_REVISION_ERROR` | 500 | /datasets/{namespace}/{name}/versions/{version} |
| `CANNOT_DELETE_LATEST_VERSION` | 400 | /datasets/{namespace}/{name}/versions/{version} |
| `DELETE_VERSION_TAG_ERROR` | 500 | /datasets/{namespace}/{name}/versions/{version} |
| `LIST_ALL_MANIFESTS_ERROR` | 500 | /manifests |
| `INVALID_PAYLOAD_FORMAT` | 400 | /manifests |
| `INVALID_MANIFEST` | 400 | /manifests |
| `MANIFEST_VALIDATION_ERROR` | 400 | /manifests |
| `UNSUPPORTED_DATASET_KIND` | 400 | /manifests |
| `MANIFEST_STORAGE_ERROR` | 500 | /manifests |
| `MANIFEST_REGISTRATION_ERROR` | 500 | /manifests |
| `INVALID_HASH` | 400 | /manifests/{hash} |
| `INVALID_HASH` | 400 | /manifests/{hash} |
| `INVALID_HASH` | 400 | /manifests/{hash}/datasets |
| `SCHEDULER_LIST_WORKERS_ERROR` | 500 | /workers |
| `INVALID_WORKER_ID` | 400 | /workers/{id} |

- `error_message`: Human-readable description (may change, use error_code for programmatic handling)

## Error Codes by Endpoint

### /datasets

**Errors that can occur during dataset listing  This enum represents all possible error conditions that can occur when handling a `GET /datasets` request.**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `METADATA_DB_ERROR` | 500 (INTERNAL_SERVER_ERROR) | An error occurred while querying the metadata database This covers database connection issues, query failures, and other internal database errors. | • N/A |

**Errors that can occur when listing datasets**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `LIST_ALL_DATASETS_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Dataset store operation error when listing all datasets | • Failed to query all datasets from the dataset store<br>• Database connection issues<br>• Internal database errors |

**Errors that can occur during dataset registration  This enum represents all possible error conditions when handling a request to register a dataset in the local registry.**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_PAYLOAD_FORMAT` | 400 (BAD_REQUEST) | Invalid request format | • Request JSON is malformed or invalid<br>• Required fields are missing or have wrong types<br>• Dataset name or version format is invalid |
| `INVALID_MANIFEST` | 400 (BAD_REQUEST) | Invalid derived dataset manifest content or structure | • Manifest JSON is malformed or invalid<br>• Manifest structure doesn't match expected schema<br>• Required manifest fields are missing or invalid |
| `MANIFEST_VALIDATION_ERROR` | 400 (BAD_REQUEST) | Manifest validation error | • N/A |
| `MANIFEST_REGISTRATION_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Failed to register manifest in the system | • Error during manifest processing or storage<br>• Registry information extraction failed<br>• System-level registration errors |
| `MANIFEST_LINKING_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Failed to link manifest to dataset | • Error during manifest linking in metadata database<br>• Error updating dev tag |
| `VERSION_TAGGING_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Failed to tag version for the dataset | • Error during version tagging in metadata database<br>• Invalid semantic version format<br>• Error updating latest tag |
| `UNSUPPORTED_DATASET_KIND` | 400 (BAD_REQUEST) | Unsupported dataset kind | • Dataset kind is not one of the supported types (manifest, evm-rpc, firehose, eth-beacon) |
| `MANIFEST_NOT_FOUND` | 404 (NOT_FOUND) | Manifest not found | • A manifest hash was provided but the manifest doesn't exist in the system<br>• The hash is valid format but no manifest is stored with that hash |
| `STORE_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Dataset store error | • Failed to load dataset from store<br>• Dataset store configuration errors<br>• Dataset store connectivity issues |

### /datasets/{namespace}/{name}

**Errors that can occur when deleting a dataset**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_PATH` | 400 (BAD_REQUEST) | Invalid path parameters | • The namespace or name in the URL path is invalid<br>• Path parameter parsing fails |
| `UNLINK_DATASET_MANIFESTS_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Dataset store operation error when unlinking dataset manifests | • Failed to delete dataset manifest links from database<br>• Database connection or transaction issues |

### /datasets/{namespace}/{name}/versions

**Errors that can occur when listing versions**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_PATH` | 400 (BAD_REQUEST) | Invalid path parameters | • The namespace or name in the URL path is invalid<br>• Path parameter parsing fails |
| `LIST_VERSION_TAGS_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Dataset store operation error when listing version tags | • Failed to query version tags from the dataset store<br>• Database connection issues<br>• Internal database errors |
| `RESOLVE_REVISION_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Dataset store operation error when resolving revision | • Failed to resolve dev tag revision<br>• Database connection issues<br>• Internal database errors |

### /datasets/{namespace}/{name}/versions/{revision}

**Errors that can occur when getting a dataset**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_PATH` | 400 (BAD_REQUEST) | Invalid path parameters | • The namespace, name, or revision in the URL path is invalid<br>• Path parameter parsing fails |

### /datasets/{namespace}/{name}/versions/{revision}/deploy

**Errors that can occur when deploying a dataset**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_PATH` | 400 (BAD_REQUEST) | Invalid path parameters | • The namespace, name, or revision in the URL path is invalid<br>• Path parameter parsing fails |
| `INVALID_BODY` | 400 (BAD_REQUEST) | Invalid request body | • The request body is not valid JSON<br>• The JSON structure doesn't match the expected schema<br>• Required fields are missing or have invalid types |

### /datasets/{namespace}/{name}/versions/{revision}/manifest

**Errors that can occur when getting a manifest**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_PATH` | 400 (BAD_REQUEST) | Invalid path parameters | • The namespace, name, or revision in the URL path is invalid<br>• Path parameter parsing fails |

### /datasets/{namespace}/{name}/versions/{version}

**Errors that can occur when deleting a version**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_PATH` | 400 (BAD_REQUEST) | Invalid path parameters | • The namespace, name, or version in the URL path is invalid<br>• Path parameter parsing fails |
| `RESOLVE_LATEST_REVISION_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Failed to resolve the "latest" revision | • Failed to resolve which manifest the "latest" tag points to<br>• Database connection issues<br>• Internal database errors during resolution |
| `RESOLVE_VERSION_REVISION_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Failed to resolve the version revision | • Failed to resolve which manifest the requested version points to<br>• Database connection issues<br>• Internal database errors during resolution |
| `CANNOT_DELETE_LATEST_VERSION` | 400 (BAD_REQUEST) | Cannot delete the version currently tagged as "latest" | • Attempting to delete the version that is currently tagged as "latest"<br>• Create a newer version first to update the "latest" tag |
| `DELETE_VERSION_TAG_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Dataset store operation error when deleting version tag | • Failed to delete version tag from the dataset store<br>• Database connection issues<br>• Internal database errors during deletion |

### /manifests

**Errors that can occur when listing manifests**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `LIST_ALL_MANIFESTS_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Metadata database operation error when listing all manifests | • Failed to query all manifests from the metadata database<br>• Database connection issues<br>• Internal database errors |

**Errors that can occur during manifest registration  This enum represents all possible error conditions when handling a request to register a manifest without dataset association.**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_PAYLOAD_FORMAT` | 400 (BAD_REQUEST) | Invalid request format | • Request JSON is malformed or invalid<br>• Request body cannot be parsed as valid JSON<br>• Required fields are missing or have wrong types |
| `INVALID_MANIFEST` | 400 (BAD_REQUEST) | Invalid manifest content or structure | • Manifest JSON is malformed or invalid<br>• Manifest structure doesn't match expected schema for the given kind<br>• Required manifest fields (name, kind, version, etc.) are missing or invalid<br>• JSON serialization/deserialization fails during canonicalization |
| `MANIFEST_VALIDATION_ERROR` | 400 (BAD_REQUEST) | Manifest validation error for derived datasets | • N/A |
| `UNSUPPORTED_DATASET_KIND` | 400 (BAD_REQUEST) | Unsupported dataset kind | • Dataset kind is not one of the supported types (manifest, evm-rpc, firehose, eth-beacon)<br>• The 'kind' field in the manifest contains an unrecognized value |
| `MANIFEST_STORAGE_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Failed to write manifest to object store | • Object store is not accessible or connection fails<br>• Write permissions are insufficient<br>• Storage quota is exceeded<br>• Network errors prevent writing to remote storage |
| `MANIFEST_REGISTRATION_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Failed to register manifest in metadata database | • Database connection is lost<br>• SQL insertion or update query fails<br>• Database constraints are violated<br>• Schema inconsistencies prevent registration |

### /manifests/{hash}

**Errors that can occur during manifest deletion  This enum represents all possible error conditions that can occur when handling a `DELETE /manifests/{hash}` request.**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_HASH` | 400 (BAD_REQUEST) | The manifest hash in the URL path is invalid | • The hash contains invalid characters or doesn't follow hash format conventions<br>• The hash is empty or malformed<br>• Path parameter extraction fails for the hash (deserialization error) |

**Errors that can occur during manifest retrieval  This enum represents all possible error conditions when handling a request to retrieve a manifest by its content hash.**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_HASH` | 400 (BAD_REQUEST) | The manifest hash is invalid | • The hash contains invalid characters or doesn't follow hash format conventions<br>• The hash is empty or malformed<br>• Path parameter extraction fails for the hash (deserialization error) |

### /manifests/{hash}/datasets

**Errors that can occur when listing datasets using a manifest  This enum represents all possible error conditions when handling a request to list datasets that reference a specific manifest hash.**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_HASH` | 400 (BAD_REQUEST) | The manifest hash is invalid | • The hash contains invalid characters or doesn't follow hash format conventions<br>• The hash is empty or malformed<br>• Path parameter extraction fails for the hash (deserialization error) |

### /workers

**Errors that can occur during worker listing  This enum represents all possible error conditions that can occur when handling a `GET /workers` request.**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `SCHEDULER_LIST_WORKERS_ERROR` | 500 (INTERNAL_SERVER_ERROR) | Failed to list workers from the scheduler | • Database connection fails or is lost during the query<br>• Query execution encounters an internal database error<br>• Connection pool is exhausted or unavailable |

### /workers/{id}

**Errors that can occur during worker retrieval  This enum represents all possible error conditions that can occur when handling a `GET /workers/{id}` request, from path parsing to scheduler operations.**

| Error Code | HTTP Status | Description | Occurs When |
|------------|-------------|-------------|-------------|
| `INVALID_WORKER_ID` | 400 (BAD_REQUEST) | The worker node ID in the URL path is invalid | • The ID cannot be parsed as a valid node identifier<br>• The path parameter is missing or malformed<br>• The ID format does not match the expected NodeId type |
