# Pull Request Description

## Add Multi-Select Legend Filtering for Map Markers

### Summary
This PR transforms the static map legend into an interactive multi-select filter, allowing users to dynamically show and hide map markers by category. Users can now click legend items to filter the map, with quick action buttons for bulk selection management.

### Features Added

#### Interactive Legend Filtering
- **Checkbox-based selection**: Each legend category now has a checkbox that can be toggled to show/hide markers
- **Multi-select support**: Users can select any combination of categories
- **Visual feedback**: Selected categories are visually indicated (white background)
- **Default state**: All categories are selected by default on page load

#### Quick Action Buttons
- **"Show None" button**: Appears when one or more categories are selected, allows users to quickly deselect all categories
- **"Show All" button**: Appears when one or more categories are unselected, allows users to quickly select all categories
- **Button layout**: All three buttons ("Hide Legend", "Show None", "Show All") are displayed on the same row for better UX

#### Marker Filtering Logic
- **Efficient filtering**: Markers are filtered by showing/hiding them via opacity changes
- **Multi-role support**: Correctly handles markers that belong to multiple categories (shown if any selected category matches)
- **Performance**: Uses efficient data structures (Map, Set) for fast lookups

### UI/UX Improvements
- Removed orange background highlight from selected legend items (now white)
- Improved button layout with horizontal arrangement
- Maintains existing show/hide legend functionality
- Responsive design maintained for mobile devices

### Technical Implementation

**Files Modified:**
- `src/map.js`: Added marker tracking, filtering logic, and updated legend HTML generation
- `src/index.js`: Added event handlers for legend interactions and button management
- `src/style/main.scss`: Updated styles for interactive legend items and button layout

**Key Changes:**
1. **Marker Management**: Store references to markers in a `categoryToMarkers` Map for efficient filtering
2. **Filtering Function**: `filterMarkersByCategories()` handles showing/hiding markers based on selected categories
3. **State Management**: Track selected categories using a Set, with automatic UI updates
4. **Event Handling**: Proper click handlers for checkboxes, legend items, and quick action buttons

### Testing Notes
- Verify all categories are selected by default
- Test clicking individual legend items to filter markers
- Test "Show None" button functionality
- Test "Show All" button functionality
- Verify markers with multiple roles appear when any matching category is selected
- Test on both desktop and mobile views
- Verify legend show/hide toggle still works correctly

### Screenshots
(Add screenshots showing the new interactive legend with checkboxes and action buttons)

