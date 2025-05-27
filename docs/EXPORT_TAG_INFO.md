# Export Tag Info CLI Command Design

## Overview
A CLI command to export tag information from the HomeGallery database to CSV format. This feature allows users to extract tag data for analysis, backup, or integration with external tools. The command reads from both the database and events files to provide the most current tag state, including any recent tag additions or removals.

## Command Structure
```bash
gallery export tags [options]
```

## Command Description
Export tag data to CSV format with complete file paths. Can export all tagged files with their tags, or filter to files with a specific tag. The command automatically resolves relative file paths to full absolute paths by mapping index files to their corresponding source directories.

## Options

### Required Options
None - all options are now optional with sensible defaults.

### Optional Options
- `--database, -d <filename>` - Database filename 
  - Type: string
  - Default: `{configDir}/{configPrefix}database.db` (automatically detected from configuration)
  - Description: Path to the HomeGallery database file
  
- `--events, -e <filename>` - Events filename
  - Type: string  
  - Default: `{configDir}/{configPrefix}events.db` (automatically detected from configuration)
  - Description: Path to the HomeGallery events file containing tag changes
  
- `--tag, -t <tag>` - Specific tag to filter by
  - Type: string
  - Default: none (exports all tagged files)
  - Description: When specified, only exports filenames that contain this tag (case-insensitive partial match)
  
- `--filename, -f <filename>` - Output CSV filename with path
  - Type: string  
  - Default: auto-generated (see Default Filename Logic below)
  - Description: Full path and filename for the output CSV file

### Inherited Options
- `--config, -c` - Configuration file (from parent export command)
- `--auto-config` - Search for configuration (from parent export command)

## Output Format

### When No Tag Filter is Specified (`--tag` not provided)
CSV format with two columns:
```csv
filename,tags
/path/to/image1.jpg,"vacation,beach,summer"
/path/to/image2.jpg,"family,birthday"
/path/to/video.mp4,"vacation,travel,mountains"
```

**Rules:**
- Only include files that have at least one tag
- Full absolute file paths are provided (resolved from database index mappings)
- Tags are comma-separated within quotes
- Files with no tags are excluded
- Special characters in filenames and tags are properly escaped according to CSV standards

### When Tag Filter is Specified (`--tag vacation`)
CSV format with single column:
```csv
/path/to/image1.jpg
/path/to/video.mp4
```

**Rules:**
- Only include files that contain the specified tag (case-insensitive partial match)
- Full absolute file paths are provided
- Single column output (filename only)
- No CSV header row

### Empty Results Handling

**When no tagged files exist in database:**
```csv
filename,tags
"No tagged files found",
```

**When specified tag is not found (e.g., `--tag nonexistent`):**
```csv
No files found with tag: nonexistent
```

## Data Sources

### Database Integration
- Reads the main database file containing media entries and their associated tags
- Each entry contains file information and baseline tag data

### Events Integration  
- Reads the events file to capture recent tag changes (additions/removals)
- Applies events chronologically to get the current tag state
- Events override database tags to provide the most up-to-date information

### File Path Resolution
- Maps file index references to actual source directories using index file headers
- Resolves relative file paths to complete absolute paths
- Handles multiple source directories configured in the gallery setup

## Default Filename Logic

When `--filename` is not specified:
1. Use the same directory as the configuration files (`{configDir}`)
2. Generate filename: `tags-export-YYYYMMDD-HHMM.csv`
   - Format: `tags-export-{YYYYMMDD}-{HHMM}.csv`
   - Example: `tags-export-20250526-2213.csv` (10:13 PM on May 26, 2025)
   - Uses local time (not UTC)
   - 24-hour time format without separators in the date portion

## Error Handling

### Validation Errors
- Missing database file → Exit with error message
- Database file unreadable → Exit with error message  
- Missing index files → Exit with error message (needed for path resolution)
- Invalid output directory → Exit with error message
- Output file cannot be created → Exit with error message

### Data Errors
- No tagged files found → Create CSV with headers and explanatory row: `"No tagged files found",`
- Specified tag not found → Create CSV with explanatory text: `No files found with tag: [tagname]`
- Database read errors → Exit with error message
- Events file missing → Warning logged, continues with database-only tags
- Events file unreadable → Warning logged, continues with database-only tags

## Implementation Details

### File Structure
- Add new command to `packages/cli/src/export.js`
- Follow existing pattern of other export commands (`static`, `meta`)

### Dependencies
- Database access: Use existing database utilities from `@home-gallery/database`
- Events access: Use existing events utilities from `@home-gallery/events`
- Index file reading: Use `@home-gallery/index` for path resolution
- CSV generation: Node.js built-in string generation with proper CSV escaping
- File operations: Node.js `fs` module
- Date formatting: Standard JavaScript Date methods with local time

### Configuration Integration
- Use existing config loading mechanism (`load()` function)
- Support automatic `database.file` path resolution when not specified
- Support automatic `events.file` path resolution 
- Access configuration directory for default output location
- Map index files to source directories for full path resolution

### Argument Mapping
```javascript
const argvMapping = {
  database: 'database.file',
  events: 'events.file',
  tag: 'exportTags.tag',
  filename: 'exportTags.filename'
}
```

### Default Configuration Setup
```javascript
const setDefaults = (config) => {
  // Set up index files for path resolution
  config.fileIndex = {
    files: config.sources?.filter(s => !s.offline).map(s => s.index),
    ...config.fileIndex
  }
  
  // Set default database path if not provided
  if (!config.database?.file) {
    const configDir = config.configDir || '{configDir}'
    const configPrefix = config.configPrefix || ''
    config.database = {
      file: `${configDir}/${configPrefix}database.db`,
      ...config.database
    }
  }
}
```

## Example Usage

### Export all tagged files with their tags
```bash
gallery export tags -d ./gallery.db
# Output: ./config/photo-tags-20250526-2049.csv
```

### Export files with specific tag (case-insensitive)
```bash
gallery export tags -d ./gallery.db --tag vacation
# Output: ./config/photo-tags-20250526-2049.csv (only vacation files)
# Note: Will match "vacation", "Vacation", "VACATION", etc.
```

### Export to specific file
```bash
gallery export tags -d ./gallery.db -f /exports/my-tags.csv
# Output: /exports/my-tags.csv
```

### Export specific tag to specific file
```bash
gallery export tags -d ./gallery.db --tag family -f ./family-photos.csv
# Output: ./family-photos.csv (only family tagged files)
```

## Integration Points

### Database Schema
- Access entry records with tags field
- Filter entries where `tags` array is not empty
- For tag filter: filter where `tags` array includes specified tag (case-insensitive match)

### Configuration System
- Use existing `validatePaths()` for database file validation
- Use existing logger config to determine default output directory
- Follow existing config loading pattern

### Logging
- Log start of export process
- Log completion with count of exported files
- Log any warnings (empty results, missing tags)
- Use timing pattern like other export commands

## Testing Considerations

### Unit Tests
- CSV generation with various tag combinations
- Filename generation with different timestamps
- Error handling for missing files/invalid paths

### Integration Tests  
- End-to-end command execution
- Database integration
- File output verification
- Configuration loading

### Edge Cases
- Empty database
- Database with no tagged files
- Files with special characters in filenames/tags
- Very large tag lists
- Unicode characters in tags

## Future Enhancements (Out of Scope)

- Export tag statistics (tag counts, most used tags)
- Multiple tag filters (AND/OR logic)
- Different output formats (JSON, XML)
- Tag hierarchy/category information
- Include file metadata (size, date, etc.)
