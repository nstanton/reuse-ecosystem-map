# Commit Message

```
feat: Add multi-select legend filtering for map markers

Implement interactive legend with checkbox-based filtering that allows
users to show/hide map markers by category. Add "Show All" and "Show None"
quick action buttons for bulk selection management.

Changes:
- Convert static legend to interactive multi-select filter
- Add checkboxes to each legend category item
- Implement marker filtering logic that handles markers with multiple roles
- Add "Show None" button (appears when one or more categories selected)
- Add "Show All" button (appears when one or more categories unselected)
- Display filter buttons on same row as "Hide Legend" button
- Update legend styling: remove orange background, use white for selected state
- Default to all categories selected on page load

Technical details:
- Store marker references in category-to-markers Map for efficient filtering
- Use Leaflet setStyle() to show/hide markers via opacity
- Track selected categories using Set data structure
- Handle edge cases: markers with multiple roles, empty selections
```

