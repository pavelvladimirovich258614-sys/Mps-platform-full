from typing import Literal

import nh3
from pydantic import BaseModel, Field, field_validator


class TourRequestCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    contact: str = Field(min_length=3, max_length=255)
    destination: str = Field(min_length=1, max_length=255)
    budget: str | None = Field(default=None, max_length=100)
    comment: str | None = Field(default=None, max_length=2000)
    personal_data_consent: Literal[True]

    @field_validator("name", "contact", "destination", "budget", "comment", mode="before")
    @classmethod
    def sanitize_plain_text(cls, value: object) -> object:
        if not isinstance(value, str):
            return value
        cleaned = nh3.clean(value, tags=set()).strip()
        return cleaned or None
