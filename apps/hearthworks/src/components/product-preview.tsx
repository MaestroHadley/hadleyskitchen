const schedule = [
  { time: "5:30", label: "Mix country loaves", detail: "3 batches", state: "done" },
  { time: "7:10", label: "Shape cinnamon rolls", detail: "48 rolls", state: "active" },
  { time: "8:20", label: "Load oven · round 1", detail: "12 loaves", state: "next" },
];

export function ProductPreview() {
  return (
    <div className="product-preview" aria-label="Example Hearthworks production plan">
      <div className="preview__chrome">
        <span />
        <span />
        <span />
        <p>Saturday Pickup · Production</p>
      </div>

      <div className="preview__body">
        <aside className="preview__rail" aria-hidden="true">
          <span className="preview__rail-mark">H</span>
          <i className="is-active" />
          <i />
          <i />
          <i />
        </aside>

        <div className="preview__content">
          <div className="preview__heading">
            <div>
              <span className="preview__eyebrow">Bake plan</span>
              <h2>Saturday Pickup</h2>
            </div>
            <span className="preview__status">On track</span>
          </div>

          <div className="preview__metrics">
            <div><strong>126</strong><span>items planned</span></div>
            <div><strong>9</strong><span>whole batches</span></div>
            <div><strong>4</strong><span>oven loads</span></div>
          </div>

          <div className="preview__section-title">
            <strong>Today&apos;s rhythm</strong>
            <span>Friday, 5:30 AM</span>
          </div>

          <div className="preview__schedule">
            {schedule.map((item) => (
              <div className={`preview__task preview__task--${item.state}`} key={item.time}>
                <time>{item.time}</time>
                <span className="preview__check" aria-hidden="true" />
                <div><strong>{item.label}</strong><small>{item.detail}</small></div>
              </div>
            ))}
          </div>

          <div className="preview__shopping">
            <div><span>Shopping list</span><strong>14 ingredients</strong></div>
            <div className="preview__progress"><span /></div>
            <small>Flour, butter, eggs, fruit, packaging + 9 more</small>
          </div>
        </div>
      </div>
    </div>
  );
}
