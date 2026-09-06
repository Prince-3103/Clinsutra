"""
Shared Pydantic v2 base. Every schema uses camelCase on the wire (matching the
frontend's TS types) while staying snake_case in Python — `CamelModel` handles
the translation both ways so routers/services never see aliasing concerns.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class LocalizedText(BaseModel):
    en: str
    hi: str
