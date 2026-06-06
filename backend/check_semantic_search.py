#!/usr/bin/env python3
"""Check semantic search setup and create embeddings for races."""

import asyncio
from sqlmodel import Session, select, func
from app.core.db import engine
from app.models import Race
from app.services.ai import embed_race
from app import crud


async def check_setup():
    """Check if semantic search is properly configured."""
    print("=" * 60)
    print("Semantic Search Setup Check")
    print("=" * 60)
    
    with Session(engine) as session:
        # Check if embedding column exists and has data
        total_races = session.exec(select(func.count(Race.id))).one()
        races_with_embeddings = session.exec(
            select(func.count(Race.id)).where(Race.embedding.isnot(None))
        ).one()
        races_without_embeddings = total_races - races_with_embeddings
        
        print(f"\n📊 Race Statistics:")
        print(f"   Total races: {total_races}")
        print(f"   Races with embeddings: {races_with_embeddings}")
        print(f"   Races without embeddings: {races_without_embeddings}")
        
        if races_without_embeddings > 0:
            print(f"\n⚠️  {races_without_embeddings} races need embeddings")
            print("   Run: python -m backend.check_semantic_search --generate")
        else:
            print("\n✅ All races have embeddings!")
        
        # Test semantic search
        if races_with_embeddings > 0:
            print("\n🔍 Testing semantic search...")
            test_query = "trail running mountain"
            try:
                from app.services.ai import embed_text
                query_embedding = await embed_text(test_query)
                results = crud.semantic_search_races(
                    session=session,
                    query_embedding=query_embedding,
                    limit=5
                )
                print(f"   Query: '{test_query}'")
                print(f"   Found {len(results)} results")
                for race_id, rank in results[:3]:
                    race = session.get(Race, race_id)
                    if race:
                        print(f"   - Rank {rank}: {race.name}")
                print("\n✅ Semantic search is working!")
            except Exception as e:
                print(f"\n❌ Semantic search test failed: {e}")
        
        print("\n" + "=" * 60)


async def generate_embeddings(limit: int = 50):
    """Generate embeddings for races that don't have them."""
    print("=" * 60)
    print("Generating Embeddings")
    print("=" * 60)
    
    with Session(engine) as session:
        races = crud.get_races_without_embedding(session=session, limit=limit)
        total = len(races)
        
        if total == 0:
            print("\n✅ All races already have embeddings!")
            return
        
        print(f"\n📝 Generating embeddings for {total} races...")
        
        for i, race in enumerate(races, 1):
            try:
                print(f"   [{i}/{total}] {race.name[:50]}...", end=" ")
                embedding = await embed_race(race)
                crud.update_race_embedding(
                    session=session,
                    race_id=race.id,
                    embedding=embedding
                )
                print("✅")
            except Exception as e:
                print(f"❌ Error: {e}")
        
        print(f"\n✅ Generated {total} embeddings!")
        print("=" * 60)


if __name__ == "__main__":
    import sys
    
    if "--generate" in sys.argv:
        # Generate embeddings
        limit = 50
        if "--all" in sys.argv:
            limit = 10000  # High limit to process all
        asyncio.run(generate_embeddings(limit=limit))
    else:
        # Just check status
        asyncio.run(check_setup())
