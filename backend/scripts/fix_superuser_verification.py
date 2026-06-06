#!/usr/bin/env python3
"""
Fix script to set is_verified=True for existing superusers.
Run this once after the email verification feature was added.
"""
import logging

from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import engine
from app.models import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def main() -> None:
    logger.info("Fixing superuser email verification status...")
    
    with Session(engine) as session:
        # Get all superusers
        statement = select(User).where(User.is_superuser == True)
        superusers = session.exec(statement).all()
        
        updated_count = 0
        for user in superusers:
            if not user.is_verified:
                logger.info(f"Setting is_verified=True for superuser: {user.email}")
                user.is_verified = True
                session.add(user)
                updated_count += 1
        
        if updated_count > 0:
            session.commit()
            logger.info(f"Updated {updated_count} superuser(s)")
        else:
            logger.info("No superusers needed updating")
    
    logger.info("Done!")


if __name__ == "__main__":
    main()
