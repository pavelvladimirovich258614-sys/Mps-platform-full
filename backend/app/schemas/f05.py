from pydantic import BaseModel,Field
from app.models.question import QuestionTarget
class SubscribeIn(BaseModel): email: str=Field(min_length=3,max_length=320)
class QuestionIn(BaseModel): target: QuestionTarget; body: str=Field(min_length=1)
class IrishkaQuestionIn(BaseModel): text: str = Field(min_length=1, max_length=2000)
class AnswerIn(BaseModel): question_id:int; answer:str=Field(min_length=1); answered_by_name:str=Field(min_length=1,max_length=255)
