"""Add cover_image_url and banner_image_url to race table

Revision ID: 0cf922026289
Revises: 88968afdc9ad
Create Date: 2026-05-18 22:54:49.982365

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '0cf922026289'
down_revision = '88968afdc9ad'
branch_labels = None
depends_on = None


def upgrade():
    # Add cover_image_url and banner_image_url columns to race table
    op.add_column('race', sa.Column('cover_image_url', sa.String(length=1000), nullable=True))
    op.add_column('race', sa.Column('banner_image_url', sa.String(length=1000), nullable=True))
    
    # Populate cached URLs for existing races from their media assets
    connection = op.get_bind()
    
    # Update cover_image_url with primary cover images
    connection.execute(sa.text("""
        UPDATE race
        SET cover_image_url = subq.file_url
        FROM (
            SELECT DISTINCT ON (content_id) 
                content_id, file_url
            FROM mediaasset
            WHERE content_type = 'race' 
                AND kind = 'cover'
                AND is_public = true
            ORDER BY content_id, is_primary DESC, created_at DESC
        ) subq
        WHERE race.id = subq.content_id
    """))
    
    # Update banner_image_url with primary banner images
    connection.execute(sa.text("""
        UPDATE race
        SET banner_image_url = subq.file_url
        FROM (
            SELECT DISTINCT ON (content_id) 
                content_id, file_url
            FROM mediaasset
            WHERE content_type = 'race' 
                AND kind = 'banner'
                AND is_public = true
            ORDER BY content_id, is_primary DESC, created_at DESC
        ) subq
        WHERE race.id = subq.content_id
    """))


def downgrade():
    # Remove cover_image_url and banner_image_url columns from race table
    op.drop_column('race', 'banner_image_url')
    op.drop_column('race', 'cover_image_url')
