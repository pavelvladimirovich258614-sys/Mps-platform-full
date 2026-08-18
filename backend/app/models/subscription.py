from datetime import datetime
from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base
class Subscription(Base):
 __tablename__="subscriptions"
 id: Mapped[int]=mapped_column(Integer,primary_key=True); email: Mapped[str]=mapped_column(String(320),unique=True); confirmed: Mapped[bool]=mapped_column(Boolean,default=False); confirm_token: Mapped[str]=mapped_column(String(128),unique=True); unsub_token: Mapped[str]=mapped_column(String(128),unique=True); created_at: Mapped[datetime]=mapped_column(DateTime(timezone=True),server_default=func.now())
