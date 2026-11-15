import styles from './ChipGroup.module.css'

// multi: value is an array. single: value is a string (click again to unselect).
export default function ChipGroup({ label, hint, options, value, onChange, multi = false }) {
  const isOn = (o) => (multi ? value.includes(o) : value === o)
  function click(o) {
    if (multi) onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o])
    else onChange(value === o ? '' : o)
  }
  return (
    <fieldset className={styles.group}>
      <legend>{label} {hint && <small>{hint}</small>}</legend>
      <div className={styles.chips}>
        {options.map((o) => (
          <button
            type="button"
            key={o}
            className={`${styles.chip} ${isOn(o) ? styles.on : ''}`}
            aria-pressed={isOn(o)}
            onClick={() => click(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
