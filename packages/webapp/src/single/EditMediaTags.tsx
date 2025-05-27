import * as React from "react";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import * as icons from '@fortawesome/free-solid-svg-icons'

import { useEventStore } from '../store/event-store'
import { useEntryStore } from '../store/entry-store'
import { TagInput } from "../dialog/tag-input";
import { Tag } from "../api/models";
import { RecentTags } from "../dialog/recent-tags";
import { UsedTags } from "../dialog/used-tags";
import { SingleTagHelp } from "../dialog/tag-dialog-help";
import { useDialogStore } from "../dialog/tag-dialog-store";
import { addTags } from '../api/ApiService';

const useAllTags = () => {
  const allEntries = useEntryStore(state => state.allEntries)

  return React.useMemo(() => {
    const allTags = {}
    allEntries.forEach(entry => {
      if (!entry.tags?.length) {
        return
      }
      entry.tags.forEach((tag: string) => {
        if (!allTags[tag]) {
          allTags[tag] = 1
        } else {
          allTags[tag]++
        }
      })
    })

    const toTagCount = ([name, count]) => ({name, count})
    const byName = (a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
    return Object.entries(allTags).map(toTagCount).sort(byName)
  }, [allEntries])
}

export const EditMediaTags = ({entry, dispatch}) => {
  const origTags: Tag[] = (entry.tags || []).map(name => ({name, remove: false}))
  const [state, dialogDispatch] = useDialogStore({tags: origTags})
  const [showHelp, setShowHelp] = useState(false)
  const [entryId, setEntryId] = useState(entry.id)
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null)
  const recentTags = useEventStore(state => state.recentTags);
  const allTags = useAllTags();

  useEffect(() => {
    dialogDispatch({type: 'setAllTags', value: allTags.map(tag => tag.name).sort()})
  }, [allTags])

  // Auto-save function for immediate tag operations
  const autoSaveTag = async (tagName: string, remove: boolean) => {
    try {
      setAutoSaveError(null)
      const tagActions = [{name: tagName, remove}]
      await addTags([entry.id], tagActions)
    } catch (error) {
      console.error('Auto-save failed:', error)
      setAutoSaveError(`Failed to ${remove ? 'remove' : 'add'} tag "${tagName}". Please try again.`)
        // Handle failed tag operations
      if (!remove) {
        // If adding failed, remove the tag from state and clear input
        dialogDispatch({type: 'removeTag', value: tagName})
        // Clear input if it contains the failed tag
        if (state.inputValue.trim() === tagName) {
          dialogDispatch({type: 'suggestTag', value: ''})
        }
      } else {
        // If removal failed, add the tag back to state but leave input unchanged
        // This allows the user to see what they were trying to remove and try again
        dialogDispatch({type: 'addTag', value: tagName})
      }
    }
  }

  // Custom dispatch wrapper that handles auto-save for tag operations
  const autoSaveDispatch = (action) => {
    // Handle auto-save for tag addition
    if (action.type === 'addTag' && action.value) {
      const tagName = action.value.replace(/^-/, '') // Remove minus prefix if present
      const isRemoval = action.value.startsWith('-')
      
      // First update the UI optimistically
      dialogDispatch(action)
      
      // Then auto-save in the background
      autoSaveTag(tagName, isRemoval)
      return
    }

    // Handle auto-save for tag removal
    if (action.type === 'removeTag' && action.value) {
      // First update the UI optimistically
      dialogDispatch(action)
      
      // Then auto-save the removal
      autoSaveTag(action.value, true)
      return
    }    // For all other actions, just dispatch normally
    dialogDispatch(action)
  }
  // Reset dialog state when entry changes
  useEffect(() => {
    if (entry.id !== entryId) {
      setEntryId(entry.id)
      setAutoSaveError(null) // Clear any previous errors
      // Clear existing tags and add new ones
      state.tags.forEach(tag => {
        dialogDispatch({type: 'removeTag', value: tag.name})
      })
      const newOrigTags: Tag[] = (entry.tags || []).map(name => ({name, remove: false}))
      newOrigTags.forEach(tag => {
        dialogDispatch({type: 'addTag', value: tag.name})
      })
      
      // Ensure no element has focus after entry change to preserve arrow key navigation
      setTimeout(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          (document.activeElement as HTMLElement).blur()
        }
      }, 0)
    }
  }, [entry.id, entryId, state.tags])

  // Ensure no element has focus when panel opens to preserve arrow key navigation
  useEffect(() => {
    // Small delay to let React finish rendering
    const timer = setTimeout(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        (document.activeElement as HTMLElement).blur()
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [])
  if (!entry) {
    return (<></>)
  }

  const onCancel = () => {
    dispatch({type: 'toggleQuickTagging'});
  }

  return (
    <>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl text-gray-300">Edit Media Tags</h3>
          <a className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-700 hover:cursor-pointer"
            onClick={onCancel}
            title="Close edit media tags">
            <FontAwesomeIcon icon={icons.faXmark} className="text-gray-700 hover:text-gray-400 active:text-gray-200"/>
          </a>        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="tags" className="flex items-center content-center gap-1">
              <span className="text-gray-400">Add Tags</span>
              <a className="w-6 h-6 ml-1 hover:cursor-pointer" onClick={() => setShowHelp(show => !show)} title="Show help for tag input">
                <FontAwesomeIcon icon={icons.faQuestionCircle} className="text-gray-500 hover:text-gray-300"/>
              </a>
            </label>
            <SingleTagHelp show={showHelp} setShow={setShowHelp} />
            <TagInput 
              tags={state.tags} 
              withRemove={false} 
              suggestions={state.suggestions} 
              showSuggestions={state.showSuggestions} 
              dispatch={autoSaveDispatch} 
              value={state.inputValue}
              autoFocus={false}
              tabIndex={1}
            />
            <RecentTags tags={recentTags} dispatch={autoSaveDispatch} />
            <UsedTags title="Most used tags:" tags={allTags} initialCount={5} dispatch={autoSaveDispatch} />
            {autoSaveError && (
              <div className="flex items-center justify-between p-3 text-red-200 bg-red-900/50 border border-red-800 rounded">
                <span className="text-sm">{autoSaveError}</span>
                <button 
                  onClick={() => setAutoSaveError(null)}
                  className="flex items-center justify-center w-5 h-5 ml-2 rounded hover:bg-red-800/50"
                  title="Dismiss error"
                >
                  <FontAwesomeIcon icon={icons.faXmark} className="text-xs"/>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
