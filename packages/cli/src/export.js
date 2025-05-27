import Logger from '@home-gallery/logger'

import { load, mapArgs, validatePaths } from './config/index.js'

const log = Logger('cli.export')

const command = {
  command: 'export',
  describe: 'Export commands',
  builder: (yargs) => {
    return yargs.option({
      config: {
        alias: 'c',
        describe: 'Configuration file'
      },
      'auto-config': {
        boolean: true,
        default: true,
        describe: 'Search for configuration on common configuration directories'
      },
      database: {
        alias: 'd',
        describe: 'Database filename'
      },
      events: {
        alias: 'e',
        describe: 'Events filename'
      },
    })
    .command(
      ['static', '$0'],
      'Create a static website export',
      (yargs) => yargs
        .options({
          storage: {
            alias: 's',
            describe: 'Storage directory'
          },
          output: {
            alias: 'o',
            describe: 'Output directory of export'
          },
          file: {
            alias: 'f',
            type: 'string',
            describe: 'Archive filename of export. Must end with .zip or .tar.gz'
          },
          keep: {
            alias: 'k',
            type: 'boolean',
            describe: 'Keep outputdirectory on archives'
          },
          query: {
            alias: 'q',
            type: 'string',
            describe: 'Search query for matching entries'
          },
          'base-path': {
            alias: ['b', 'prefix'],
            type: 'string',
            default: '/',
            describe: 'Base path of static page. e.g. "/gallery"'
          },
          'edit': {
            type: 'boolean',
            default: false,
            describe: 'Enable edit menu'
          }
        })
        .demandOption(['storage', 'database']),
      (argv) => {
        const argvMapping = {
          database: 'database.file',
          events: 'events.file',
          storage: 'storage.dir',

          output: 'export.dir',
          basePath: 'export.basePath',
          file: 'export.archiveFile',
          keep: 'export.keepDir',
          query: 'export.query',
          edit: {path: 'export.disableEdit', map: v => !v},
        }

        const run = async() => {
          const { exportBuilder } = await import('@home-gallery/export-static')
          const { promisify } = await import('@home-gallery/common')

          const options = await load(argv.config, false, argv.autoConfig)

          mapArgs(argv, options.config, argvMapping)
          validatePaths(options.config, ['database.file', 'storage.dir', 'export.dir'])

          const asyncExportBuilder = promisify(exportBuilder)
          return asyncExportBuilder(options)
        }

        const t0 = Date.now();
        return run()
          .then((dir, archiveFile) => {
            log.info(t0, `Created export to ${archiveFile ? archiveFile : dir}`);
          })
          .catch(err => {
            log.error(`Export failed: ${err}`);
            process.exit(1)
          })

      }
    )
    .command(
      ['meta'],
      'Export meta data to xmp sidecar files',
      (yargs) => yargs
        .options({
          index: {
            alias: 'i',
            describe: 'Index file',
            array: true
          },
          'changes-after': {
            alias: 'A',
            string: true,
            describe: 'Only write meta data changes after given date (in ISO 8601)'
          },
          'dry-run': {
            alias: 'n',
            boolean: true,
            default: false,
            describe: 'Do not perform any writes'
          },
        })
        .demandOption(['index', 'database']),
      (argv) => {
        const mapping = {
          index: 'fileIndex.files',
          database: 'database.file',
          events: 'events.file',

          changesAfter: 'exportMeta.changesAfter',
          dryRun: 'exportMeta.dryRun'
        }

        const setDefaults = (config) => {
          config.fileIndex = {
            files: config.sources?.filter(s => !s.offline).map(s => s.index),
            ...config.fileIndex
          }
        }

        const run = async () => {
          const { exportMeta } = await import('@home-gallery/export-meta')

          const options = await load(argv.config, false, argv.autoConfig)

          mapArgs(argv, options.config, mapping)
          setDefaults(options.config)
          validatePaths(options.config, ['fileIndex.files', 'database.file', 'events.file'])

          return exportMeta(options)
        }

        log.info(`Exporting meta data to sidecar files${argv.dryRun? ' in dry run mode' : ''}`)
        const t0 = Date.now();
        return run()
          .then((updatedFiles) => {            if (updatedFiles.length) {
              log.info(t0, `Exported meta data to ${updatedFiles.length} sidecar files${argv.dryRun? ' (dry run)' : ''}`)
            } else {
              log.info(t0, `No new meta data exported`)
            }
          })
          .catch(e => {
            log.error(e, `Failed to export meta data: ${e}`)
            process.exit(1)
          })
      }
    )    .command(
      ['tags'],
      'Export tag information to CSV format',
      (yargs) => yargs        .options({
          tag: {
            alias: 't',
            type: 'string',
            describe: 'Filter to files with specific tag (case-insensitive)'
          },
          filename: {
            alias: 'f',
            type: 'string',
            describe: 'Output CSV filename'
          }
        }),
      (argv) => {        const argvMapping = {
          database: 'database.file',
          events: 'events.file',
          tag: 'exportTags.tag',
          filename: 'exportTags.filename'
        }

        const setDefaults = (config) => {
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

        const run = async () => {
          const { readDatabase } = await import('@home-gallery/database')
          const { readEvents } = await import('@home-gallery/events')
          const { promisify } = await import('@home-gallery/common')
          const { readIndexHead } = await import('@home-gallery/index')
          const fs = await import('fs/promises')
          const path = await import('path')

          const options = await load(argv.config, false, argv.autoConfig)
          mapArgs(argv, options.config, argvMapping)
          setDefaults(options.config)
          validatePaths(options.config, ['database.file', 'fileIndex.files'])

          const readDatabaseAsync = promisify(readDatabase)
          const readEventsAsync = promisify(readEvents)
          const readIndexHeadAsync = promisify(readIndexHead)
          
          // Create index root map for resolving full paths
          const getIndexRootMap = async (indices) => {
            log.trace(`Reading file index heads of ${indices.length} indices`)
            const t0 = new Date()
            const indexHeads = await Promise.all(indices.map(index => readIndexHeadAsync(index)))
            log.debug(t0, `Read ${indexHeads.length} file index heads`)
            return Object.fromEntries(indexHeads.map(index => [index.indexName, index.base]))          }
          
          // Read database and events
          const database = await readDatabaseAsync(options.config.database.file)
          
          // Get index root mapping for full paths
          const rootMap = await getIndexRootMap(options.config.fileIndex.files)
          
          // Read events if events file exists
          let events = []
          const eventsFile = options.config.events?.file
          if (eventsFile) {
            try {
              const eventsData = await readEventsAsync(eventsFile)
              events = eventsData.data || []
            } catch (err) {
              log.warn(`Could not read events file ${eventsFile}: ${err.message}`)
            }
          }

          // Apply events to database entries to get current tag state
          const applyEventsToEntries = (entries, events) => {
            // Create a map of entry ID to entry for fast lookup
            const entryMap = new Map()
            entries.forEach(entry => {
              entryMap.set(entry.id, { ...entry, tags: [...(entry.tags || [])] })
            })

            // Apply tag events
            events.forEach(event => {
              if (event.type === 'userAction' && event.targetIds && event.actions) {
                event.targetIds.forEach(targetId => {
                  const entry = entryMap.get(targetId)
                  if (entry) {
                    event.actions.forEach(action => {
                      if (action.action === 'addTag') {
                        if (!entry.tags.includes(action.value)) {
                          entry.tags.push(action.value)
                        }
                      } else if (action.action === 'removeTag') {
                        const index = entry.tags.indexOf(action.value)
                        if (index > -1) {
                          entry.tags.splice(index, 1)
                        }
                      }
                    })
                  }
                })
              }
            })

            return Array.from(entryMap.values())
          }

          const entriesWithTags = applyEventsToEntries(database.data, events)

          // Filter entries with tags
          let filteredEntries = entriesWithTags.filter(entry => entry.tags && entry.tags.length > 0)

          // Apply tag filter if specified
          const tagFilter = options.config.exportTags?.tag
          if (tagFilter) {
            const normalizedTagFilter = tagFilter.toLowerCase()
            filteredEntries = filteredEntries.filter(entry => 
              entry.tags.some(tag => tag.toLowerCase().includes(normalizedTagFilter))
            )
          }

          // Generate CSV content
          let csvContent = ''
          
          if (filteredEntries.length === 0) {
            if (tagFilter) {
              csvContent = `No files found with tag: ${tagFilter}\n`
            } else {
              csvContent = 'filename,tags\n"No tagged files found",\n'
            }
          } else {            if (tagFilter) {
              // Single column output when filtering by tag
              filteredEntries.forEach(entry => {
                entry.files.forEach(file => {
                  // Resolve full path using index mapping
                  const baseDir = rootMap[file.index] || ''
                  const fullPath = baseDir ? path.join(baseDir, file.filename) : file.filename
                  const escapedFilename = `"${fullPath.replace(/"/g, '""')}"`
                  csvContent += `${escapedFilename}\n`
                })
              })
            } else {
              // Two column output when showing all tagged files
              csvContent = 'filename,tags\n'
              filteredEntries.forEach(entry => {
                entry.files.forEach(file => {
                  // Resolve full path using index mapping
                  const baseDir = rootMap[file.index] || ''
                  const fullPath = baseDir ? path.join(baseDir, file.filename) : file.filename
                  const escapedFilename = `"${fullPath.replace(/"/g, '""')}"`
                  const escapedTags = `"${entry.tags.join(',').replace(/"/g, '""')}"`
                  csvContent += `${escapedFilename},${escapedTags}\n`
                })
              })
            }
          }          // Determine output filename
          let outputFilename = options.config.exportTags?.filename
          if (!outputFilename) {
            const now = new Date()
            // Format as YYYYMMDD-HHMM using local time
            const year = now.getFullYear()
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const day = String(now.getDate()).padStart(2, '0')
            const hours = String(now.getHours()).padStart(2, '0')
            const minutes = String(now.getMinutes()).padStart(2, '0')
            const timestamp = `${year}${month}${day}-${hours}${minutes}`
            const loggerConfigDir = options.config.configDir || path.join(process.env.HOME || process.env.USERPROFILE || '.', '.config', 'home-gallery')
            outputFilename = path.join(loggerConfigDir, `tags-export-${timestamp}.csv`)
          }

          // Write CSV file
          await fs.writeFile(outputFilename, csvContent, 'utf8')
          
          return { outputFilename, count: filteredEntries.length }
        }

        const t0 = Date.now()
        return run()
          .then(({ outputFilename, count }) => {
            log.info(t0, `Exported ${count} tagged file(s) to ${outputFilename}`)
          })
          .catch(err => {
            log.error(`Export tags failed: ${err}`)
            process.exit(1)
          })
      }
    )
  }
}

export default command;
