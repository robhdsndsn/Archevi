# Windmill Python Script Dependencies

This document tracks the complete dependency tree required for Windmill Python scripts in FamilySecondBrain. Windmill does not automatically resolve transitive dependencies, so all dependencies must be explicitly listed.

## embed_document_enhanced.py

**Path:** `f/chatbot/embed_document_enhanced`
**Last Updated:** 2025-12-01
**Working Hash:** `fcc5af80f5e42130`

### Complete Dependency List (26 packages)

```python
# requirements:
#   Core dependencies
#   - cohere
#   - psycopg2-binary
#   - pgvector
#   - numpy
#   - wmill
#   Cohere SDK dependencies
#   - fastavro
#   - tokenizers
#   - types-requests
#   Tokenizers/HuggingFace chain
#   - huggingface-hub
#   - filelock
#   - fsspec
#   - packaging
#   - pyyaml
#   - tqdm
#   Requests chain
#   - requests
#   - urllib3
#   - charset-normalizer
#   HTTP client chain (httpx -> httpcore -> h11)
#   - httpx
#   - httpx-sse
#   - httpcore
#   - h11
#   - anyio
#   - sniffio
#   - idna
#   - certifi
#   Pydantic chain
#   - pydantic
#   - pydantic-core
#   - annotated-types
#   - typing_extensions
#   - typing_inspection
```

### Dependency Chain Breakdown

| Chain | Root Package | Transitive Dependencies |
|-------|--------------|------------------------|
| **Cohere SDK** | cohere | fastavro, httpx, httpx-sse, pydantic, pydantic-core, requests, tokenizers, types-requests, typing_extensions |
| **pgvector** | pgvector | numpy |
| **httpx** | httpx | httpcore, h11, anyio, sniffio, idna, certifi |
| **requests** | requests | urllib3, charset-normalizer, idna, certifi |
| **pydantic** | pydantic | pydantic-core, annotated-types, typing_extensions, typing_inspection |
| **tokenizers** | tokenizers | huggingface-hub |
| **huggingface-hub** | huggingface-hub | filelock, fsspec, packaging, pyyaml, requests, tqdm, typing-extensions |

### Common Issues and Fixes

#### ModuleNotFoundError: No module named 'X'

When you see this error, add the missing module to both:
1. The `# requirements:` comment block in the script
2. The `lock` array in the deployment API call

#### TypeError: Object of type float32 is not JSON serializable

Cohere embeddings return numpy float32 values. Convert to Python float before JSON serialization:
```python
'category_confidence': float(result['category_confidence'])
```

### How to Check Dependencies

Use pip to find transitive dependencies:
```bash
pip show <package> | grep -i requires
```

Example:
```bash
$ pip show cohere | grep -i requires
Requires: fastavro, httpx, httpx-sse, pydantic, pydantic-core, requests, tokenizers, types-requests, typing_extensions

$ pip show httpx | grep -i requires
Requires: anyio, certifi, httpcore, idna

$ pip show pydantic | grep -i requires
Requires: annotated-types, pydantic-core, typing-extensions, typing-inspection
```

### Deployment Template

When deploying scripts with complex dependencies:

```javascript
const payload = {
  path: 'f/chatbot/script_name',
  summary: 'Script description',
  content: scriptContent,
  language: 'python3',
  is_template: false,
  lock: [
    // List ALL dependencies here - Windmill doesn't resolve transitive deps
    'cohere', 'psycopg2-binary', 'pgvector', 'numpy', 'wmill',
    'fastavro', 'tokenizers', 'types-requests',
    'huggingface-hub', 'filelock', 'fsspec', 'packaging', 'pyyaml', 'tqdm',
    'requests', 'urllib3', 'charset-normalizer',
    'httpx', 'httpx-sse', 'httpcore', 'h11', 'anyio', 'sniffio', 'idna', 'certifi',
    'pydantic', 'pydantic-core', 'annotated-types', 'typing_extensions', 'typing_inspection'
  ]
};
```

### Testing Scripts

Always test scripts via API before considering them deployed:

```bash
curl -s -X POST "http://localhost/api/w/family-brain/jobs/run_wait_result/p/f/chatbot/embed_document_enhanced" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Test content","tenant_id":"YOUR_TENANT_ID"}'
```

## Other Scripts Using Cohere

These scripts likely need the same dependency tree:

- `rag_query.py` - RAG question answering
- `search_documents.py` - Semantic document search
- `search_documents_advanced.py` - Advanced search with filters
- `suggest_tags.py` - AI tag suggestions

When updating these scripts, copy the full dependency list from embed_document_enhanced.py.

## Version Notes

- **Cohere SDK v5.x** introduced breaking changes requiring pydantic v2
- **Pydantic v2** requires `typing_inspection` (not present in v1)
- **pgvector** requires numpy for vector operations
- **tokenizers** (HuggingFace) has a large dependency tree
