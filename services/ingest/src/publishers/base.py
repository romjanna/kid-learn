from abc import ABC, abstractmethod


class Publisher(ABC):
    """Abstract publisher interface. Swap Redis for GCP Pub/Sub by implementing this."""

    @abstractmethod
    async def publish(self, channel: str, message: dict) -> None:
        pass

    @abstractmethod
    async def close(self) -> None:
        pass
