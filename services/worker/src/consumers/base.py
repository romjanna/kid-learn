from abc import ABC, abstractmethod
from typing import AsyncIterator


class Consumer(ABC):
    """Abstract consumer interface. Swap Redis for GCP Pub/Sub by implementing this."""

    @abstractmethod
    async def subscribe(self, channel: str) -> None:
        pass

    @abstractmethod
    async def listen(self) -> AsyncIterator[dict]:
        pass

    @abstractmethod
    async def close(self) -> None:
        pass
