# HomeGallery Search Instructions

## Overview
HomeGallery provides a powerful query language for searching your photo and video collection. You can search by tags, dates, file properties, camera settings, locations, and more using a flexible syntax that supports logical operators and complex expressions.

## Basic Search Syntax

### Simple Text Search
Search for any text that appears in filenames, tags, or metadata:
```
vacation
IMG_5503
```

### Key-Value Search
Search for specific metadata fields:
```
tag:vacation
year:2024
type:image
filename:IMG_5503
```

### Quoted Values
Use quotes for values containing spaces or special characters:
```
tag:"family vacation"
city:"San Francisco"
filename:"IMG 5503.MOV"
```

## Logical Operators

### AND - Both conditions must be true
```
tag:vacation and year:2024
type:image and tag:family
camera:iPhone and iso > 400
```

### OR - Either condition can be true
```
tag:vacation or tag:travel
year:2023 or year:2024
type:image or type:video
```

### NOT - Exclude results
```
not tag:delete
tag:vacation and not tag:work
not exists(tags)
```

### Parentheses for Grouping
```
(tag:vacation or tag:travel) and year:2024
not (tag:delete or tag:private)
```

## Available Search Keys

### Tags
- `tag:vacation` - Search by specific tag
- `exists(tags)` - Files that have any tags
- `not exists(tags)` - Files without any tags
- `count(tags) > 3` - Files with more than 3 tags

### Date and Time
- `year:2024` - Specific year
- `year in [2020:2024]` - Year range
- `month:12` - Specific month (1-12)
- `month in (6,7,8)` - Summer months
- `day:25` - Specific day of month
- `date:2024-05-26` - Specific date
- `date > 2024-01-01` - Date comparison

### File Properties
- `filename:IMG_5503` - Search by filename
- `type:image` - File type (image, video)
- `size > 1000000` - File size in bytes
- `width > 1920` - Image/video width in pixels
- `height > 1080` - Image/video height in pixels

### Camera and EXIF Data
- `camera:Canon` - Camera make/model
- `make:Apple` - Camera manufacturer
- `model:iPhone` - Camera model
- `iso > 800` - ISO sensitivity
- `aperture < 2.8` - Aperture f-stop
- `focal in [24:70]` - Focal length range

### Location (if available)
- `country:USA` - Country name
- `state:California` - State or region
- `city:"San Francisco"` - City name

### People and Faces (if face detection enabled)
- `exists(face)` - Files with detected faces
- `not exists(face)` - Files without faces
- `person:John` - Specific person (if face recognition enabled)

## Comparison Operators

### Equality
```
year = 2024
tag = vacation
```

### Inequality
```
year != 2024
tag != delete
```

### Greater/Less Than
```
year > 2020
size < 5000000
iso >= 400
width <= 1920
```

### Pattern Matching
```
filename ~ "IMG_*"
tag ~ "vac*"
```

## Lists and Ranges

### IN Lists - Match any value in the list
```
tag in (vacation, travel, holiday)
year in (2022, 2023, 2024)
month in (6,7,8)
```

### ALL IN Lists - Must contain all values
```
tag all in (vacation, family)
```

### Ranges - Values between two points
```
year in [2020:2024]
size in [1000000:10000000]
focal in [24:70]
```

## Functions

### EXISTS - Check if field has any value
```
exists(tags)
exists(face)
exists(location)
```

### COUNT - Count items in a field
```
count(tags) > 3
count(face) = 0
count(tags) in [1:5]
```

## Sorting Results

### Basic Sorting
```
tag:vacation order by year
type:image order by filename
```

### Sort Direction
```
tag:vacation order by year desc
size > 1000000 order by size asc
```

### Sort by Count
```
exists(tags) order by count(tags) desc
year:2024 order by count(face)
```

## Complex Query Examples

### Multiple Tags
```
# Photos with both vacation AND family tags
tag:vacation and tag:family

# Photos with either vacation OR travel tags
tag:vacation or tag:travel

# Photos with vacation tag but NOT work tag
tag:vacation and not tag:work
```

### Date-based Searches
```
# All photos from 2024
year:2024

# Summer photos from recent years
month in (6,7,8) and year in [2020:2024]

# Photos from specific date range
date in [2024-01-01:2024-12-31]
```

### Camera and Quality Filters
```
# High-quality iPhone photos
make:Apple and width > 1920 and height > 1080

# Low-light photos
iso > 1600

# Portrait photos (specific focal length)
focal in [85:135]
```

### File Management
```
# Large video files
type:video and size > 100000000

# Untagged files that need attention
not exists(tags) and year:2024

# Files with many tags
count(tags) > 5
```

### Location-based (if GPS data available)
```
# Vacation photos from California
tag:vacation and state:California

# Travel photos from specific countries
tag:travel and country in (France, Italy, Spain)
```

## Tips and Best Practices

### 1. Start Simple, Then Add Complexity
Begin with basic searches and gradually add more criteria:
```
tag:vacation
tag:vacation and year:2024
tag:vacation and year:2024 and type:image
```

### 2. Use Quotes for Multi-word Values
```
tag:"family vacation"
city:"New York"
```

### 3. Combine OR with Parentheses
```
(tag:vacation or tag:travel) and year:2024
```

### 4. Find Untagged Content
```
not exists(tags)
count(tags) = 0
```

### 5. Case Sensitivity
Most searches are case-insensitive:
```
tag:VACATION  # same as tag:vacation
```

### 6. Wildcard Patterns
Use the `~` operator for pattern matching:
```
filename ~ "IMG_*"
tag ~ "*vacation*"
```

## Common Search Scenarios

### Photo Organization
```
# Find photos that need tagging
not exists(tags) and year:2024

# Find duplicate or similar filenames
filename ~ "IMG_*" order by filename

# Find largest files
order by size desc
```

### Event-based Searches
```
# Birthday party photos
tag:birthday and tag:family and year:2024

# Vacation memories
(tag:vacation or tag:travel) order by date desc

# Holiday celebrations
tag in (christmas, thanksgiving, easter) and year:2024
```

### Technical Searches
```
# High-resolution images
width > 3000 and height > 2000

# Photos needing quality review
iso > 3200 or aperture > 8

# Mobile vs camera photos
make:Apple or make:Samsung  # Mobile photos
make:Canon or make:Nikon    # Camera photos
```

## Troubleshooting

### No Results Found
- Check spelling of tag names and field values
- Verify the field exists in your media collection
- Try broader search criteria first
- Use `exists(fieldname)` to see what fields are available

### Too Many Results
- Add more specific criteria with `and`
- Use date ranges to narrow down timeframes
- Add file type filters (`type:image` or `type:video`)

### Syntax Errors
- Ensure parentheses are balanced
- Use quotes around values with spaces
- Check operator spelling (`and`, `or`, `not`, `in`)

### Performance Tips
- More specific searches are faster
- Date ranges are generally efficient
- Complex nested queries may be slower

## Advanced Features

### Nested Queries
```
tag:vacation and (year:2023 or year:2024) and not tag:work
```

### Multiple Sorting Criteria
```
tag:family order by year desc, month desc, day desc
```

### Field Existence Checks
```
exists(location) and exists(tags) and year:2024
```

This query language provides powerful capabilities for organizing, finding, and managing your photo collection efficiently.
