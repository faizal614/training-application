import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  EditorContent,
  useEditor,
} from '@tiptap/react'

import StarterKit from '@tiptap/starter-kit'
import LinkExtension from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

import { apiFetch } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'

function TrainingContent() {
  const {
    isAuthenticated,
    handleSessionExpired,
  } = useAuth()

  // =========================================================
  // COURSE / MODULE / CONTENT STATE
  // =========================================================

  const [courses, setCourses] = useState([])
  const [modules, setModules] = useState([])
  const [contents, setContents] = useState([])

  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedModule, setSelectedModule] = useState('')

  // =========================================================
  // FORM STATE
  // =========================================================

  const [description, setDescription] = useState('')
  const [contentType, setContentType] = useState('text')
  const [body, setBody] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [displayOrder, setDisplayOrder] = useState(1)

  // =========================================================
  // EDIT STATE
  // =========================================================

  const [editingContentId, setEditingContentId] =
    useState(null)

  const isEditing =
    editingContentId !== null

  const hasExistingContent =
    contents.length > 0

  // =========================================================
  // LOADING / MESSAGE STATE
  // =========================================================

  const [loading, setLoading] = useState(false)
  const [contentLoading, setContentLoading] =
    useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // =========================================================
  // TIPTAP EDITOR
  // =========================================================

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),

      LinkExtension.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),

      Placeholder.configure({
        placeholder:
          'Write your training content here...',
      }),
    ],

    content: '',

    onUpdate: ({ editor }) => {
      setBody(editor.getHTML())
    },
  })

  // =========================================================
  // UPDATE EDITOR CONTENT
  // =========================================================

  const setEditorContent = (content) => {
    if (!editor) {
      return
    }

    editor.commands.setContent(
      content || '',
      false
    )

    setBody(content || '')
  }

  // =========================================================
  // FETCH COURSES
  // =========================================================

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      setError('')

      const response = await apiFetch(
        '/courses/',
        {},
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to fetch courses'
        )
      }

      setCourses(data)
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          'Failed to fetch courses'
      )
    }
  }

  // =========================================================
  // COURSE CHANGE
  // =========================================================

  const handleCourseChange = async (event) => {
    const courseId = event.target.value

    setSelectedCourse(courseId)
    setSelectedModule('')
    setModules([])
    setContents([])

    resetForm()

    if (!courseId) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await apiFetch(
        `/courses/${courseId}/modules`,
        {},
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to fetch modules'
        )
      }

      setModules(data)
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          'Failed to fetch modules'
      )
    }
  }

  // =========================================================
  // MODULE CHANGE
  // =========================================================

  const handleModuleChange = async (event) => {
    const moduleId = event.target.value

    setSelectedModule(moduleId)
    setContents([])

    resetForm()

    if (!moduleId) {
      return
    }

    await fetchModuleContent(moduleId)
  }

  // =========================================================
  // FETCH EXISTING CONTENT
  // =========================================================

  const fetchModuleContent = async (moduleId) => {
    try {
      setContentLoading(true)
      setError('')

      const response = await apiFetch(
        `/modules/${moduleId}/content`,
        {},
        handleSessionExpired
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to fetch training content'
        )
      }

      setContents(
        Array.isArray(data)
          ? data
          : []
      )
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          'Failed to fetch training content'
      )
    } finally {
      setContentLoading(false)
    }
  }

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setDescription('')
    setContentType('text')
    setBody('')
    setVideoUrl('')
    setDisplayOrder(1)

    setEditingContentId(null)

    if (editor) {
      editor.commands.clearContent()
    }
  }

  // =========================================================
  // EDIT CONTENT
  // =========================================================

  const handleEdit = (content) => {
    setError('')
    setSuccess('')

    setEditingContentId(content.id)

    // -------------------------------------------------------
    // LOAD DESCRIPTION
    // -------------------------------------------------------

    setDescription(
      content.description || ''
    )

    // -------------------------------------------------------
    // LOAD CONTENT TYPE
    // -------------------------------------------------------

    setContentType(
      content.content_type || 'text'
    )

    // -------------------------------------------------------
    // LOAD VIDEO URL
    // -------------------------------------------------------

    setVideoUrl(
      content.video_url || ''
    )

    // -------------------------------------------------------
    // LOAD BODY
    // -------------------------------------------------------

    const existingBody =
      content.body || ''

    setBody(existingBody)

    setEditorContent(existingBody)

    // -------------------------------------------------------
    // LOAD DISPLAY ORDER
    // -------------------------------------------------------

    setDisplayOrder(
      content.display_order || 1
    )

    // -------------------------------------------------------
    // SCROLL TO FORM
    // -------------------------------------------------------

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================================================
  // CANCEL EDIT
  // =========================================================

  const handleCancelEdit = () => {
    resetForm()
    setError('')
    setSuccess('')
  }

  // =========================================================
  // CREATE / UPDATE CONTENT
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedCourse) {
      setError(
        'Please select a course'
      )
      return
    }

    if (!selectedModule) {
      setError(
        'Please select a module'
      )
      return
    }

    if (!isAuthenticated) {
      setError(
        'Please sign in to continue.'
      )
      return
    }

    // -------------------------------------------------------
    // ONLY ONE CONTENT PER MODULE
    // -------------------------------------------------------

    if (
      !isEditing &&
      hasExistingContent
    ) {
      setError(
        'This module already has training content. Please edit or delete the existing content.'
      )
      return
    }

    // -------------------------------------------------------
    // VALIDATE DESCRIPTION
    // -------------------------------------------------------

    if (!description.trim()) {
      setError(
        'Please enter a content description.'
      )
      return
    }

    // -------------------------------------------------------
    // GET FINAL EDITOR TEXT
    // -------------------------------------------------------

    const editorText =
      editor?.getText().trim() || ''

    // -------------------------------------------------------
    // VALIDATE TEXT CONTENT
    //
    // Text content requires theory/content.
    // -------------------------------------------------------

    if (
      contentType === 'text' &&
      !editorText
    ) {
      setError(
        'Text content requires training content.'
      )
      return
    }

    // -------------------------------------------------------
    // VALIDATE VIDEO CONTENT
    //
    // Video requires a URL.
    // Theory/content is optional.
    // -------------------------------------------------------

    if (
      contentType === 'video' &&
      !videoUrl.trim()
    ) {
      setError(
        'Video content requires a video URL.'
      )
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      // -------------------------------------------------------
      // GET FINAL EDITOR HTML
      // -------------------------------------------------------

      const editorHtml =
        editor?.getHTML() || body

      // -------------------------------------------------------
      // GET SELECTED MODULE
      // -------------------------------------------------------

      const selectedModuleData =
        modules.find(
          (module) =>
            String(module.id) ===
            String(selectedModule)
        )

      const moduleTitle =
        selectedModuleData?.title ||
        selectedModuleData?.name ||
        `Module ${selectedModule}`

      // =====================================================
      // PAYLOAD
      // =====================================================

      const payload = {
        // Module name is automatically
        // used as the content title.
        title: moduleTitle,

        description:
          description.trim(),

        content_type:
          contentType,

        video_url:
          contentType === 'video'
            ? videoUrl.trim()
            : null,

        // ---------------------------------------------------
        // IMPORTANT:
        //
        // Text -> body required
        // Video -> body optional
        //
        // This allows a video to have
        // supporting theory as well.
        // ---------------------------------------------------

        body:
          editorText
            ? editorHtml
            : null,

        display_order:
          Number(displayOrder),
      }

      // =====================================================
      // UPDATE EXISTING CONTENT
      // =====================================================

      if (isEditing) {
        const response =
          await apiFetch(
            `/modules/content/${editingContentId}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify(
                payload
              ),
            },
            handleSessionExpired
          )

        const data =
          await response.json()

        if (!response.ok) {
          throw new Error(
            data?.detail ||
              'Failed to update training content'
          )
        }

        setSuccess(
          'Training content updated successfully.'
        )

        resetForm()

        await fetchModuleContent(
          selectedModule
        )

        return
      }

      // =====================================================
      // CREATE NEW CONTENT
      // =====================================================

      const response =
        await apiFetch(
          `/modules/${selectedModule}/content`,
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(
              payload
            ),
          },
          handleSessionExpired
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to create training content'
        )
      }

      setSuccess(
        'Training content added successfully.'
      )

      resetForm()

      await fetchModuleContent(
        selectedModule
      )
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          (
            isEditing
              ? 'Failed to update training content'
              : 'Failed to create training content'
          )
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // DELETE CONTENT
  // =========================================================

  const handleDelete = async (contentId) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this training content?'
      )

    if (!confirmed) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response =
        await apiFetch(
          `/modules/content/${contentId}`,
          {
            method: 'DELETE',
          },
          handleSessionExpired
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            'Failed to delete training content'
        )
      }

      setSuccess(
        'Training content deleted successfully.'
      )

      if (
        editingContentId === contentId
      ) {
        resetForm()
      }

      await fetchModuleContent(
        selectedModule
      )
    } catch (err) {
      console.error(err)

      if (
        err.message ===
        'Session expired. Please sign in again.'
      ) {
        return
      }

      setError(
        err.message ||
          'Failed to delete training content'
      )
    }
  }

  // =========================================================
  // GET COURSE NAME
  // =========================================================

  const getCourseName = (course) => {
    return (
      course.title ||
      course.name ||
      `Course ${course.id}`
    )
  }

  // =========================================================
  // GET MODULE NAME
  // =========================================================

  const getModuleName = (module) => {
    return (
      module.title ||
      module.name ||
      `Module ${module.id}`
    )
  }

  // =========================================================
  // TOOLBAR BUTTON
  // =========================================================

  const ToolbarButton = ({
    onClick,
    active = false,
    children,
    title,
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        style={{
          border: '1px solid #ccc',
          background: active
            ? '#111'
            : '#fff',
          color: active
            ? '#fff'
            : '#111',
          padding: '8px 12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          minWidth: '42px',
        }}
      >
        {children}
      </button>
    )
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '132px 28px 80px',
        fontFamily: 'Arial, sans-serif',
        color: '#111',
      }}
    >

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: '40px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            letterSpacing: '3px',
            marginBottom: '10px',
          }}
        >
          04
        </div>

        <h1
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '52px',
            fontWeight: '400',
            margin: '0 0 12px',
            lineHeight: '1.1',
          }}
        >
          Training Content
        </h1>

        <p
          style={{
            fontSize: '17px',
            color: '#555',
            margin: 0,
          }}
        >
          Add and manage text and video
          training content.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          style={{
            border: '1px solid red',
            background: '#fff5f5',
            color: 'red',
            padding: '12px',
            marginBottom: '24px',
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ====================================================== */}

      {success && (
        <div
          style={{
            border: '1px solid #222',
            background: '#f5f5f5',
            padding: '12px',
            marginBottom: '24px',
          }}
        >
          {success}
        </div>
      )}

      {/* =====================================================
          ADD / EDIT CONTENT
      ====================================================== */}

      <div
        style={{
          border: '1px solid #222',
          padding: '30px',
          marginBottom: '40px',
        }}
      >

        <h2
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: '32px',
            fontWeight: '400',
            margin: '0 0 28px',
          }}
        >
          {isEditing
            ? 'Edit Training Content'
            : 'Add Training Content'}
        </h2>

        {/* ===================================================
            ONE CONTENT NOTICE
        =================================================== */}

        {hasExistingContent &&
          !isEditing && (
            <div
              style={{
                border: '1px solid #222',
                background: '#f7f7f7',
                padding: '16px',
                marginBottom: '25px',
                lineHeight: '1.6',
              }}
            >
              This module already has
              training content. Each module
              can contain only one training
              content item. Use the
              <strong> Edit </strong>
              button below to modify it.
            </div>
          )}

        <form onSubmit={handleSubmit}>

          {/* =================================================
              COURSE
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Course
            </label>

            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              style={inputStyle}
            >
              <option value="">
                Select a course
              </option>

              {courses.map((course) => (
                <option
                  key={course.id}
                  value={course.id}
                >
                  {getCourseName(course)}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              MODULE
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Module
            </label>

            <select
              value={selectedModule}
              onChange={handleModuleChange}
              disabled={!selectedCourse}
              style={inputStyle}
            >
              <option value="">
                {selectedCourse
                  ? 'Select a module'
                  : 'Select a course first'}
              </option>

              {modules.map((module) => (
                <option
                  key={module.id}
                  value={module.id}
                >
                  {getModuleName(module)}
                </option>
              ))}
            </select>
          </div>

          {/* =================================================
              DESCRIPTION
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Enter a short description"
              rows="3"
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
            />
          </div>

          {/* =================================================
              CONTENT TYPE
          ================================================== */}

          <div
            style={{
              marginBottom: '20px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Content Type
            </label>

            <select
              value={contentType}
              onChange={(event) =>
                setContentType(
                  event.target.value
                )
              }
              style={inputStyle}
            >
              <option value="text">
                Text
              </option>

              <option value="video">
                Video
              </option>
            </select>
          </div>

          {/* =================================================
              VIDEO URL
          ================================================== */}

          {contentType === 'video' && (
            <div
              style={{
                marginBottom: '25px',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                Video URL
              </label>

              <input
                type="url"
                value={videoUrl}
                onChange={(event) =>
                  setVideoUrl(
                    event.target.value
                  )
                }
                placeholder="Enter video URL"
                style={inputStyle}
              />

              <p
                style={{
                  margin: '8px 0 0',
                  color: '#777',
                  fontSize: '13px',
                }}
              >
                Enter the video link that
                learners should watch.
              </p>
            </div>
          )}

          {/* =================================================
              TRAINING CONTENT EDITOR
              
              BOTH TEXT AND VIDEO CAN HAVE THEORY.
              
              TEXT:
              Required.
              
              VIDEO:
              Optional supporting theory.
          ================================================== */}

          {(contentType === 'text' ||
            contentType === 'video') && (
            <div
              style={{
                marginBottom: '25px',
              }}
            >

              <label
                style={{
                  display: 'block',
                  fontWeight: '600',
                  marginBottom: '8px',
                }}
              >
                {contentType === 'video'
                  ? 'Training Content (Optional)'
                  : 'Training Content'}
              </label>

              {/* =================================================
                  SCROLLABLE EDITOR
              ================================================= */}

              <div
                style={{
                  border: '1px solid #999',
                  maxHeight: '500px',
                  overflowY: 'auto',
                  background: '#fff',
                }}
              >

                {/* =================================================
                    STICKY TOOLBAR
                ================================================= */}

                <div
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    padding: '10px',
                    borderBottom:
                      '1px solid #999',
                    background: '#f7f7f7',
                  }}
                >

                  {/* PARAGRAPH */}

                  <ToolbarButton
                    title="Paragraph"
                    active={
                      editor?.isActive(
                        'paragraph'
                      )
                    }
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .setParagraph()
                        .run()
                    }
                  >
                    P
                  </ToolbarButton>

                  {/* HEADING 1 */}

                  <ToolbarButton
                    title="Heading 1"
                    active={
                      editor?.isActive(
                        'heading',
                        {
                          level: 1,
                        }
                      )
                    }
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({
                          level: 1,
                        })
                        .run()
                    }
                  >
                    H1
                  </ToolbarButton>

                  {/* HEADING 2 */}

                  <ToolbarButton
                    title="Heading 2"
                    active={
                      editor?.isActive(
                        'heading',
                        {
                          level: 2,
                        }
                      )
                    }
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({
                          level: 2,
                        })
                        .run()
                    }
                  >
                    H2
                  </ToolbarButton>

                  {/* HEADING 3 */}

                  <ToolbarButton
                    title="Heading 3"
                    active={
                      editor?.isActive(
                        'heading',
                        {
                          level: 3,
                        }
                      )
                    }
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({
                          level: 3,
                        })
                        .run()
                    }
                  >
                    H3
                  </ToolbarButton>

                  {/* BOLD */}

                  <ToolbarButton
                    title="Bold"
                    active={editor?.isActive('bold')}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleBold()
                        .run()
                    }
                  >
                    B
                  </ToolbarButton>

                  {/* ITALIC */}

                  <ToolbarButton
                    title="Italic"
                    active={editor?.isActive('italic')}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleItalic()
                        .run()
                    }
                  >
                    <em>I</em>
                  </ToolbarButton>

                  {/* BULLET LIST */}

                  <ToolbarButton
                    title="Bullet List"
                    active={editor?.isActive(
                      'bulletList'
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleBulletList()
                        .run()
                    }
                  >
                    • List
                  </ToolbarButton>

                  {/* NUMBERED LIST */}

                  <ToolbarButton
                    title="Numbered List"
                    active={editor?.isActive(
                      'orderedList'
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleOrderedList()
                        .run()
                    }
                  >
                    1. List
                  </ToolbarButton>

                  {/* BLOCKQUOTE */}

                  <ToolbarButton
                    title="Quote"
                    active={editor?.isActive(
                      'blockquote'
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleBlockquote()
                        .run()
                    }
                  >
                    Quote
                  </ToolbarButton>

                  {/* CODE */}

                  <ToolbarButton
                    title="Code"
                    active={editor?.isActive('code')}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleCode()
                        .run()
                    }
                  >
                    Code
                  </ToolbarButton>

                  {/* CODE BLOCK */}

                  <ToolbarButton
                    title="Code Block"
                    active={editor?.isActive(
                      'codeBlock'
                    )}
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .toggleCodeBlock()
                        .run()
                    }
                  >
                    Code Block
                  </ToolbarButton>

                  {/* HORIZONTAL RULE */}

                  <ToolbarButton
                    title="Horizontal Rule"
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .setHorizontalRule()
                        .run()
                    }
                  >
                    ―
                  </ToolbarButton>

                  {/* LINK */}

                  <ToolbarButton
                    title="Add Link"
                    active={editor?.isActive('link')}
                    onClick={() => {
                      const previousUrl =
                        editor
                          ?.getAttributes(
                            'link'
                          )
                          .href || ''

                      const url =
                        window.prompt(
                          'Enter URL',
                          previousUrl
                        )

                      if (
                        url === null
                      ) {
                        return
                      }

                      if (
                        url === ''
                      ) {
                        editor
                          ?.chain()
                          .focus()
                          .unsetLink()
                          .run()

                        return
                      }

                      editor
                        ?.chain()
                        .focus()
                        .setLink({
                          href: url,
                        })
                        .run()
                    }}
                  >
                    Link
                  </ToolbarButton>

                  {/* UNDO */}

                  <ToolbarButton
                    title="Undo"
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .undo()
                        .run()
                    }
                  >
                    ↶
                  </ToolbarButton>

                  {/* REDO */}

                  <ToolbarButton
                    title="Redo"
                    onClick={() =>
                      editor
                        ?.chain()
                        .focus()
                        .redo()
                        .run()
                    }
                  >
                    ↷
                  </ToolbarButton>

                </div>

                {/* =================================================
                    EDITOR AREA
                ================================================== */}

                <EditorContent
                  editor={editor}
                />

              </div>

              {/* =================================================
                  EDITOR HELP
              ================================================== */}

              <p
                style={{
                  margin: '9px 0 0',
                  color: '#777',
                  fontSize: '13px',
                  lineHeight: '1.5',
                }}
              >
                {contentType === 'video'
                  ? 'Add supporting theory or notes for the video if needed.'
                  : 'Scroll inside the editor to work on longer content. The toolbar stays visible while scrolling.'}
              </p>

            </div>
          )}

          {/* =================================================
              DISPLAY ORDER
          ================================================= */}

          <div
            style={{
              marginBottom: '25px',
            }}
          >
            <label
              style={{
                display: 'block',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              Display Order
            </label>

            <input
              type="number"
              min="1"
              value={displayOrder}
              onChange={(event) =>
                setDisplayOrder(
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </div>

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >

            <button
              type="submit"
              disabled={
                loading ||
                contentLoading ||
                (
                  hasExistingContent &&
                  !isEditing
                )
              }
              style={{
                ...buttonStyle,
                opacity:
                  loading ||
                  contentLoading ||
                  (
                    hasExistingContent &&
                    !isEditing
                  )
                    ? 0.5
                    : 1,
                cursor:
                  loading ||
                  contentLoading ||
                  (
                    hasExistingContent &&
                    !isEditing
                  )
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {loading
                ? isEditing
                  ? 'Updating...'
                  : 'Adding...'
                : isEditing
                ? 'Update Training Content'
                : 'Add Training Content'}
            </button>

            {isEditing && (
              <button
                type="button"
                onClick={
                  handleCancelEdit
                }
                disabled={loading}
                style={
                  secondaryButtonStyle
                }
              >
                Cancel Edit
              </button>
            )}

          </div>

        </form>
      </div>

      {/* =====================================================
          EXISTING CONTENT
      ====================================================== */}

      {selectedModule && (
        <div>

          {/* =================================================
              EXISTING CONTENT HEADER
          ================================================== */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >

            <h2
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '32px',
                fontWeight: '400',
                margin: 0,
              }}
            >
              Existing Content
            </h2>

            <span
              style={{
                color: '#555',
                fontSize: '14px',
              }}
            >
              {contents.length} item
              {contents.length !== 1
                ? 's'
                : ''}
            </span>

          </div>

          {/* =================================================
              LOADING
          ================================================== */}

          {contentLoading ? (
            <p>
              Loading training content...
            </p>
          ) : contents.length === 0 ? (
            <div
              style={{
                border: '1px solid #222',
                padding: '25px',
                color: '#555',
              }}
            >
              No training content has been
              added to this module yet.
            </div>
          ) : (

            /* =================================================
               CONTENT LIST
            ================================================= */

            <div
              style={{
                display: 'grid',
                gap: '20px',
              }}
            >

              {contents.map((content) => (

                <div
                  key={content.id}
                  style={{
                    border: '1px solid #222',
                    padding: '25px',
                  }}
                >

                  {/* -----------------------------------------
                      CONTENT ID
                  ------------------------------------------ */}

                  <div
                    style={{
                      fontSize: '12px',
                      letterSpacing: '2px',
                      marginBottom: '10px',
                    }}
                  >
                    CONTENT ID: {content.id}
                  </div>

                  {/* -----------------------------------------
                      CONTENT TITLE
                  ------------------------------------------ */}

                  <h3
                    style={{
                      fontFamily: 'Georgia, serif',
                      fontSize: '28px',
                      fontWeight: '400',
                      margin: '0 0 18px',
                    }}
                  >
                    {getModuleName(
                      modules.find(
                        (module) =>
                          String(module.id) ===
                          String(selectedModule)
                      ) || {}
                    )}
                  </h3>

                  {/* -----------------------------------------
                      DESCRIPTION
                  ------------------------------------------ */}

                  <div
                    style={{
                      marginBottom: '18px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        letterSpacing: '2px',
                        fontWeight: '600',
                        marginBottom: '6px',
                      }}
                    >
                      DESCRIPTION
                    </div>

                    <p
                      style={{
                        margin: 0,
                        color: '#555',
                        lineHeight: '1.5',
                      }}
                    >
                      {content.description ||
                        'No description available.'}
                    </p>
                  </div>

                  {/* -----------------------------------------
                      CONTENT TYPE
                  ------------------------------------------ */}

                  <div
                    style={{
                      fontSize: '14px',
                      marginBottom: '12px',
                    }}
                  >
                    <strong>
                      Content Type:
                    </strong>{' '}
                    {content.content_type}
                  </div>

                  {/* -----------------------------------------
                      DISPLAY ORDER
                  ------------------------------------------ */}

                  <div
                    style={{
                      fontSize: '14px',
                      marginBottom: '18px',
                    }}
                  >
                    <strong>
                      Display Order:
                    </strong>{' '}
                    {content.display_order}
                  </div>

                  {/* -----------------------------------------
                      SEPARATOR
                  ------------------------------------------ */}

                  <div
                    style={{
                      borderTop:
                        '1px solid #ddd',
                      paddingTop: '18px',
                    }}
                  >

                    {/* ---------------------------------------
                        TEXT CONTENT
                    ---------------------------------------- */}

                    {content.content_type ===
                      'text' && (
                      <>
                        <div
                          style={{
                            fontSize: '12px',
                            letterSpacing:
                              '2px',
                            fontWeight:
                              '600',
                            marginBottom:
                              '8px',
                          }}
                        >
                          TRAINING CONTENT
                        </div>

                        <div
                          style={{
                            lineHeight: '1.6',
                            marginBottom:
                              '22px',
                            padding: '20px',
                            border:
                              '1px solid #ddd',
                            background:
                              '#fafafa',
                            maxHeight:
                              '400px',
                            overflowY:
                              'auto',
                          }}
                        >
                          <div
                            className="admin-content-preview"
                            dangerouslySetInnerHTML={{
                              __html:
                                content.body ||
                                '<p>No training content available.</p>',
                            }}
                          />
                        </div>
                      </>
                    )}

                    {/* ---------------------------------------
                        VIDEO CONTENT
                    ---------------------------------------- */}

                    {content.content_type ===
                      'video' && (
                      <>
                        <div
                          style={{
                            fontSize: '12px',
                            letterSpacing:
                              '2px',
                            fontWeight:
                              '600',
                            marginBottom:
                              '8px',
                          }}
                        >
                          VIDEO
                        </div>

                        {content.video_url ? (
                          <div
                            style={{
                              marginBottom:
                                '22px',
                            }}
                          >
                            <a
                              href={
                                content.video_url
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              View Video
                            </a>
                          </div>
                        ) : (
                          <p
                            style={{
                              color: '#555',
                              marginBottom:
                                '22px',
                            }}
                          >
                            No video URL
                            available.
                          </p>
                        )}

                        {/* -----------------------------------
                            SUPPORTING THEORY
                        ------------------------------------ */}

                        {content.body && (
                          <>
                            <div
                              style={{
                                fontSize:
                                  '12px',
                                letterSpacing:
                                  '2px',
                                fontWeight:
                                  '600',
                                marginBottom:
                                  '8px',
                              }}
                            >
                              TRAINING CONTENT
                            </div>

                            <div
                              style={{
                                lineHeight:
                                  '1.6',
                                marginBottom:
                                  '22px',
                                padding:
                                  '20px',
                                border:
                                  '1px solid #ddd',
                                background:
                                  '#fafafa',
                                maxHeight:
                                  '400px',
                                overflowY:
                                  'auto',
                              }}
                            >
                              <div
                                className="admin-content-preview"
                                dangerouslySetInnerHTML={{
                                  __html:
                                    content.body,
                                }}
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* ---------------------------------------
                        ACTION BUTTONS
                    ---------------------------------------- */}

                    <div
                      style={{
                        display: 'flex',
                        gap: '10px',
                      }}
                    >

                      <button
                        type="button"
                        onClick={() =>
                          handleEdit(
                            content
                          )
                        }
                        style={
                          editButtonStyle
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            content.id
                          )
                        }
                        style={
                          deleteButtonStyle
                        }
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      )}

      {/* =====================================================
          BACK TO ADMIN DASHBOARD
      ====================================================== */}

      <div
        style={{
          marginTop: '50px',
        }}
      >
        <Link to="/admin">
          ← Back to Admin Dashboard
        </Link>
      </div>

      {/* =====================================================
          EDITOR STYLES
      ====================================================== */}

      <style>
        {`
          .ProseMirror {
            min-height: 350px;
            padding: 20px;
            outline: none;
            font-family: Arial, sans-serif;
            font-size: 16px;
            line-height: 1.7;
          }

          .ProseMirror p {
            margin: 0 0 18px;
          }

          .ProseMirror h1 {
            font-family: Georgia, serif;
            font-size: 38px;
            font-weight: 400;
            line-height: 1.2;
            margin: 30px 0 18px;
          }

          .ProseMirror h2 {
            font-family: Georgia, serif;
            font-size: 32px;
            font-weight: 400;
            line-height: 1.25;
            margin: 28px 0 16px;
          }

          .ProseMirror h3 {
            font-family: Georgia, serif;
            font-size: 26px;
            font-weight: 400;
            line-height: 1.3;
            margin: 25px 0 14px;
          }

          .ProseMirror ul,
          .ProseMirror ol {
            padding-left: 28px;
            margin: 0 0 20px;
          }

          .ProseMirror li {
            margin-bottom: 7px;
          }

          .ProseMirror blockquote {
            border-left: 4px solid #222;
            margin: 25px 0;
            padding: 12px 20px;
            background: #f5f5f5;
          }

          .ProseMirror code {
            background: #f1f1f1;
            border: 1px solid #ddd;
            padding: 2px 6px;
            font-family: Consolas, monospace;
            font-size: 0.9em;
          }

          .ProseMirror pre {
            background: #111;
            color: #fff;
            padding: 18px;
            overflow-x: auto;
            margin: 25px 0;
          }

          .ProseMirror pre code {
            background: transparent;
            border: none;
            padding: 0;
            color: inherit;
          }

          .ProseMirror hr {
            border: none;
            border-top: 1px solid #ccc;
            margin: 35px 0;
          }

          .ProseMirror a {
            text-decoration: underline;
          }

          .ProseMirror p.is-editor-empty:first-child::before {
            color: #999;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
          }

          .admin-content-preview {
            font-family: Arial, sans-serif;
            font-size: 16px;
            line-height: 1.7;
          }

          .admin-content-preview p {
            margin: 0 0 18px;
          }

          .admin-content-preview h1 {
            font-family: Georgia, serif;
            font-size: 34px;
            font-weight: 400;
            margin: 30px 0 18px;
          }

          .admin-content-preview h2 {
            font-family: Georgia, serif;
            font-size: 28px;
            font-weight: 400;
            margin: 26px 0 16px;
          }

          .admin-content-preview h3 {
            font-family: Georgia, serif;
            font-size: 23px;
            font-weight: 400;
            margin: 22px 0 14px;
          }

          .admin-content-preview ul,
          .admin-content-preview ol {
            padding-left: 28px;
            margin-bottom: 20px;
          }

          .admin-content-preview blockquote {
            border-left: 4px solid #222;
            padding: 12px 20px;
            margin: 25px 0;
            background: #f5f5f5;
          }

          .admin-content-preview pre {
            background: #111;
            color: #fff;
            padding: 18px;
            overflow-x: auto;
          }

          .admin-content-preview code {
            background: #f1f1f1;
            padding: 2px 6px;
          }
        `}
      </style>

    </div>
  )
}

// =========================================================
// STYLES
// =========================================================

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '13px',
  border: '1px solid #999',
  fontSize: '16px',
  fontFamily: 'Arial, sans-serif',
  background: '#fff',
}

const buttonStyle = {
  background: '#111',
  color: '#fff',
  border: 'none',
  padding: '14px 22px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  background: '#fff',
  color: '#111',
  border: '1px solid #111',
  padding: '13px 20px',
  fontSize: '15px',
  fontWeight: '600',
  cursor: 'pointer',
}

const editButtonStyle = {
  background: '#111',
  color: '#fff',
  border: 'none',
  padding: '11px 20px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
}

const deleteButtonStyle = {
  background: '#111',
  color: '#fff',
  border: 'none',
  padding: '11px 20px',
  fontSize: '14px',
  fontWeight: '600',
  cursor: 'pointer',
}

export default TrainingContent