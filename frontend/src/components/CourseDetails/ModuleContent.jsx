function ModuleContent({
  selectedModule,
  content,
  contentLoading,
  contentError,
}) {
  return (
    <section className="module-content">
      <p className="eyebrow">
        MODULE {selectedModule.display_order}
      </p>

      <h2>
        {selectedModule.title}
      </h2>

      {contentLoading && (
        <p>Loading content...</p>
      )}

      {contentError && (
        <p className="auth-error">
          {contentError}
        </p>
      )}

      {!contentLoading &&
        !contentError &&
        content.length === 0 && (
          <p>
            No training content is available
            for this module yet.
          </p>
        )}

      {!contentLoading &&
        !contentError &&
        content.map((item) => (
          <article
            key={item.id}
            className="training-content"
          >
            {item.subtitle && (
              <h3>
                {item.subtitle}
              </h3>
            )}

            {item.content_type === 'video' &&
              item.video_url && (
                <div className="video-container">
                  <iframe
                    src={item.video_url}
                    title={
                      item.subtitle ||
                      'Training video'
                    }
                    allowFullScreen
                  />
                </div>
              )}

            {item.body && (
              <div className="training-body">
                {item.body}
              </div>
            )}
          </article>
        ))}
    </section>
  )
}

export default ModuleContent