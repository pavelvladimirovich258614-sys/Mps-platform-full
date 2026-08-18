import asyncio
from app.config import get_settings
from app.db import Database
from app.models.subscription import Subscription
from app.services.mailer import build_digest,send_email
from sqlalchemy import select
async def main():
 settings=get_settings();db=Database(settings);html=await build_digest(db.session_factory)
 async with db.session_factory() as s:
  for sub in (await s.scalars(select(Subscription).where(Subscription.confirmed.is_(True)))).all(): await send_email(settings,sub.email,"Дайджест недели",html)
 await db.dispose()
if __name__=="__main__": asyncio.run(main())
