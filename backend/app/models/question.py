from datetime import datetime
from enum import Enum
from sqlalchemy import DateTime, Enum as SqlEnum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base
class QuestionTarget(str,Enum): MANAGER="manager"; LAWYER="lawyer"
class QuestionStatus(str,Enum): OPEN="open"; ANSWERED="answered"; CLOSED="closed"
class Question(Base):
 __tablename__="questions"
 id: Mapped[int]=mapped_column(Integer,primary_key=True); user_id: Mapped[int]=mapped_column(ForeignKey("users.id",ondelete="CASCADE")); target: Mapped[QuestionTarget]=mapped_column(SqlEnum(QuestionTarget,native_enum=False)); body: Mapped[str]=mapped_column(Text); status: Mapped[QuestionStatus]=mapped_column(SqlEnum(QuestionStatus,native_enum=False),default=QuestionStatus.OPEN); answer: Mapped[str|None]=mapped_column(Text); answered_by_name: Mapped[str|None]=mapped_column(String(255)); tg_message_id: Mapped[int|None]=mapped_column(Integer); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now()); answered_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True)); archived_at: Mapped[datetime|None]=mapped_column(DateTime(timezone=True),nullable=True)
