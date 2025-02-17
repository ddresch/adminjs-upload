import { DropZone, DropZoneItem, FormGroup, Label } from '@adminjs/design-system'
import { EditPropertyProps, flat } from 'adminjs'
import React, { FC, useEffect, useState } from 'react'
import PropertyCustom from '../types/property-custom.type.js'

const Edit: FC<EditPropertyProps> = ({ property, record, onChange }) => {
  const { params } = record
  const { custom } = property as unknown as { custom: PropertyCustom }

  const key = flat.get(params, custom.keyProperty)
  const file = flat.get(params, custom.fileProperty)

  let path = flat.get(params, custom.filePathProperty)
  if (custom.opts && custom.opts.baseUrl && path) {
    const baseUrl = custom.opts.baseUrl || ''
    // check if we deal with single file or multiple (string or array)
    if(typeof path === 'string') {
      path = `${baseUrl}/${key}`
    } else if(Array.isArray(path)) {
      path = path.map((singlePath, index) => (singlePath != null) ? `${baseUrl}/${key[index]}` : null)
    }
  }
  
  const [originalKey, setOriginalKey] = useState(key)
  const [filesToUpload, setFilesToUpload] = useState<Array<File>>([])

  useEffect(() => {
    // it means means that someone hit save and new file has been uploaded
    // in this case fliesToUpload should be cleared.
    // This happens when user turns off redirect after new/edit
    if (
      (typeof key === 'string' && key !== originalKey)
      || (typeof key !== 'string' && !originalKey)
      || (typeof key !== 'string' && Array.isArray(key) && key.length !== originalKey.length)
    ) {
      setOriginalKey(key)
      setFilesToUpload([])
    }
  }, [key, originalKey])

  const onUpload = (files: Array<File>): void => {
    setFilesToUpload(files)
    onChange(custom.fileProperty, files)
  }

  const handleRemove = () => {
    onChange(custom.fileProperty, null)
  }

  const handleMultiRemove = (singleKey) => {
    const index = (flat.get(record.params, custom.keyProperty) || []).indexOf(singleKey)
    const filesToDelete = flat.get(record.params, custom.filesToDeleteProperty) || []
    if (
      path && path.length > 0
    ) {
      const newPath = path.map((currentPath, i) => (i !== index ? currentPath : null))
      let newParams = flat.set(
        record.params,
        custom.filesToDeleteProperty,
        [...filesToDelete, index],
      )
      newParams = flat.set(newParams, custom.filePathProperty, newPath)

      onChange({
        ...record,
        params: newParams,
      })
    } else {
      // eslint-disable-next-line no-console
      console.log('You cannot remove file when there are no uploaded files yet')
    }
  }

  return (
    <FormGroup>
      <Label>{property.label}</Label>
      <DropZone
        onChange={onUpload}
        multiple={custom.multiple}
        validate={{
          mimeTypes: custom.mimeTypes as Array<string>,
          maxSize: custom.maxSize,
        }}
        files={filesToUpload}
      />
      {!custom.multiple && key && path && !filesToUpload.length && file !== null && (
        <DropZoneItem filename={key} src={path} onRemove={handleRemove} />
      )}
      {custom.multiple && key && key.length && path ? (
        <>
          {key.map((singleKey, index) => {
            // when we remove items we set only path index to nulls.
            // key is still there. This is because
            // we have to maintain all the indexes. So here we simply filter out elements which
            // were removed and display only what was left
            const currentPath = path[index]
            return currentPath ? (
              <DropZoneItem
                key={singleKey}
                filename={singleKey}
                src={path[index]}
                onRemove={() => handleMultiRemove(singleKey)}
              />
            ) : ''
          })}
        </>
      ) : ''}
    </FormGroup>
  )
}

export default Edit
