from typing import List, Protocol, Sequence


class MarkdownListItem(Protocol):
    """Protocol for items that can be rendered as Markdown list items."""

    def __str__(self) -> str:
        """Convert item to string representation.

        Returns:
            String representation of the item
        """
        ...


class MarkdownListRenderer:
    """Renderer for Markdown lists."""

    @staticmethod
    def render_bullet_list(items: Sequence[MarkdownListItem]) -> List[str]:
        """Render items as a bullet point list.

        Args:
            items: Sequence of items to render

        Returns:
            List of lines in Markdown bullet point format
        """
        return [f"* {str(item)}" for item in items]
