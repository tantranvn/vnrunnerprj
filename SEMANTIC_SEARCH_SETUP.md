# Semantic Search Setup Guide

## Overview

Semantic search is already implemented and uses:
- **pgvector** for storing and querying vector embeddings
- **OpenAI text-embedding-3-small** for generating 1536-dimensional embeddings
- **RRF (Reciprocal Rank Fusion)** to merge text search and semantic search results
- **IVFFlat index** for fast approximate nearest-neighbor search

## Quick Start

### 1. Configure OpenAI API Key

Add to your `.env` file:

```bash
OPENAI_API_KEY=sk-proj-your-actual-api-key-here
```

### 2. Generate Embeddings for Existing Races

Run the helper script to generate embeddings for all races:

```bash
cd backend
python check_semantic_search.py --generate --all
```

Or generate in batches (50 at a time):

```bash
python check_semantic_search.py --generate
```

### 3. Test Semantic Search

Check the status:

```bash
python check_semantic_search.py
```

Test via API:

```bash
curl "http://localhost:8000/api/v1/races/search?q=mountain%20trail%20running&limit=5"
```

## How It Works

### 1. Embedding Generation

When a race is created or updated:
```python
# Background task automatically generates embedding
background_tasks.add_task(_schedule_embedding, race.id)
```

The embedding is created from:
- Race name
- Description
- Location
- Terrain type
- Difficulty level
- Elevation gain

### 2. Search Flow

When a user searches:

1. **Text query** → OpenAI embedding → `query_embedding`
2. **Vector search** → Find similar races by cosine similarity
3. **Text search** → Full-text search on name, description, location
4. **RRF fusion** → Merge both result sets with reciprocal rank fusion
5. **Return** → Best matches from both semantic and text search

### 3. Search Endpoint

```python
GET /api/v1/races/search?q=trail+mountain&limit=20
```

Parameters:
- `q` - Search query (triggers both text + semantic search)
- `lat`, `lon`, `radius_km` - Geographic filtering
- `distance_min_km`, `distance_max_km` - Distance filtering
- `terrain` - Terrain type filter (road, trail, track, mixed)
- `difficulty` - Difficulty filter (easy, moderate, hard, extreme)
- `date_from`, `date_to` - Date range filter
- `tag_slugs` - Filter by tags
- `status` - Filter by status
- `province_code`, `ward_code` - Location filters
- `sort` - Sort by date, distance, or popularity
- `skip`, `limit` - Pagination

## API Endpoints

### Search with Semantic + Text (Public)
```bash
GET /api/v1/races/search?q=mountain+trail
```

### Get Similar Races (Public)
```bash
GET /api/v1/races/{race_id}/similar?limit=6
```

### Batch Generate Embeddings (Admin Only)
```bash
POST /api/v1/admin/races/reindex?batch_size=50
```

## Performance

### Index Configuration

The IVFFlat index is configured with:
- **lists=100** - Good for up to ~1M vectors
- **Cosine distance operator** (`<=>`)

For larger datasets, consider adjusting `lists`:
- 10K-100K vectors: lists=100
- 100K-1M vectors: lists=1000
- 1M+ vectors: lists=10000

### Query Performance

- Vector search: ~10-50ms for 100K vectors
- Text search: ~5-20ms with proper indexes
- RRF fusion: ~1-5ms
- **Total**: ~20-75ms end-to-end

## Monitoring

Check embedding coverage:

```python
from sqlmodel import Session, select, func
from app.core.db import engine
from app.models import Race

with Session(engine) as session:
    total = session.exec(select(func.count(Race.id))).one()
    with_embeddings = session.exec(
        select(func.count(Race.id)).where(Race.embedding.isnot(None))
    ).one()
    print(f"Coverage: {with_embeddings}/{total} ({100*with_embeddings/total:.1f}%)")
```

## Troubleshooting

### No semantic results returned

1. Check OpenAI API key is valid
2. Verify races have embeddings: `python check_semantic_search.py`
3. Check logs for embedding generation errors

### Slow queries

1. Verify IVFFlat index exists:
   ```sql
   SELECT * FROM pg_indexes WHERE indexname = 'ix_race_embedding_ivfflat';
   ```

2. Consider increasing `lists` parameter for larger datasets

### Embedding generation fails

1. Check OpenAI API key and quota
2. Check race data has meaningful content (name, description)
3. Review logs: `tail -f logs/app.log`

## Cost Estimation

OpenAI text-embedding-3-small pricing:
- **$0.02 per 1M tokens**
- Average race: ~200 tokens
- **~10,000 races = $0.04**

Very cost-effective! 🎉

## Next Steps

1. Set up OpenAI API key ✅
2. Generate embeddings for all races ✅
3. Test semantic search via API ✅
4. Monitor performance and coverage 📊
5. Consider caching for popular queries 🚀
