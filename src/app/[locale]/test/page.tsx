'use client'

import { useChat } from 'ai/react'
import { useEffect } from 'react'
import { useRef, useState } from 'react'
import Image from 'next/image'

export default function Chat() {
  const {
    messages,
    setMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    error,
    append,
    reload,
    stop,
    metadata,
    isLoading,
    data,
    setData,
  } = useChat({
    onFinish(message, options) {
      console.log(message, options)
    },
  
  })

  useEffect(() => {
    console.log('messages', messages)
  }, [messages])

  useEffect(() => {
    console.log('data', data)
  }, [data])

  const [files, setFiles] = useState<FileList | undefined>(undefined)
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className='stretch mx-auto flex w-full max-w-md flex-col py-24'>
      {messages.map((m) => (
        <div key={m.id} className='whitespace-pre-wrap'>
          {m.role === 'user' ? 'User: ' : 'AI: '}
          {m.content}
          <div>
            {m.annotations && m.annotations.map((a, index) => (
              <div key={index}>{JSON.stringify(a)}</div>
            ))}
          </div>
          <div>
            {m?.experimental_attachments
              ?.filter((attachment) =>
                attachment?.contentType?.startsWith('image/')
              )
              .map((attachment, index) => (
                <Image
                  key={`${m.id}-${index}`}
                  src={attachment.url}
                  width={500}
                  height={500}
                  alt={attachment.name ?? `attachment-${index}`}
                />
              ))}
          </div>
        </div>
      ))}

      <form
        onSubmit={event => {
          handleSubmit(event, {
            experimental_attachments: files,
          });

          setFiles(undefined);

          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        className='fixed bottom-0 mb-8 w-full max-w-md rounded border border-gray-300 shadow-xl'
      >
        <input
          type='file'
          className=''
          onChange={(event) => {
            if (event.target.files) {
              setFiles(event.target.files)
            }
          }}
          multiple
          ref={fileInputRef}
        />
        <input
          className='w-full p-2'
          value={input}
          placeholder='Say something...'
          onChange={handleInputChange}
        />
      </form>
    </div>
  )
}
