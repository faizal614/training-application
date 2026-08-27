function ModuleList({
  modules,
  selectedModule,
  onModuleClick,
}) {
  return (
    <section className="course-learning">
      <p className="eyebrow">
        COURSE CONTENT
      </p>

      <h2>Modules</h2>

      {modules.length === 0 ? (
        <p>
          No modules are available for this course yet.
        </p>
      ) : (
        <div className="module-list">
          {modules.map((module) => (
            <button
              key={module.id}
              type="button"
              className={`module-item ${
                selectedModule?.id === module.id
                  ? 'module-item--active'
                  : ''
              }`}
              onClick={() => onModuleClick(module)}
            >
              <span>
                {module.display_order}.
              </span>

              <span>
                {module.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export default ModuleList