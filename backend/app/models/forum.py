from datetime import datetime
from sqlalchemy import Boolean,DateTime,ForeignKey,Index,Integer,String,Text,func,text
from sqlalchemy.orm import Mapped,mapped_column
from app.db import Base
class ForumTopic(Base):
 __tablename__="forum_topics"
 id:Mapped[int]=mapped_column(Integer,primary_key=True);country_id:Mapped[int]=mapped_column(ForeignKey("countries.id"));author_id:Mapped[int]=mapped_column(ForeignKey("users.id"));title:Mapped[str]=mapped_column(String(255));is_locked:Mapped[bool]=mapped_column(Boolean,default=False);messages_count:Mapped[int]=mapped_column(Integer,default=0);created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now());last_message_at:Mapped[datetime|None]=mapped_column(DateTime(timezone=True))
class ForumMessage(Base):
 __tablename__="forum_messages"
 __table_args__=(Index("uq_forum_messages_one_ai_per_topic","topic_id",unique=True,postgresql_where=text("is_ai IS TRUE"),sqlite_where=text("is_ai = 1")),)
 id:Mapped[int]=mapped_column(Integer,primary_key=True);topic_id:Mapped[int]=mapped_column(ForeignKey("forum_topics.id",ondelete="CASCADE"));author_id:Mapped[int]=mapped_column(ForeignKey("users.id"));body:Mapped[str]=mapped_column(Text);is_ai:Mapped[bool]=mapped_column(Boolean,default=False);created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now())
