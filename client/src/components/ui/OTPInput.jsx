import { useRef } from 'react'

const OTPInput = ({ value, onChange }) => {
  const inputRefs = useRef([])

  const handleChange = (index, val) => {
    // Only accept numeric inputs
    const cleanVal = val.replace(/\D/g, '')
    if (!cleanVal) {
      const newVal = [...value]
      newVal[index] = ''
      onChange(newVal)
      return
    }

    const newVal = [...value]
    // Use the last typed character
    newVal[index] = cleanVal[cleanVal.length - 1]
    onChange(newVal)

    // Shift focus forward
    if (index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        const newVal = [...value]
        newVal[index - 1] = ''
        onChange(newVal)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newVal = [...value]
        newVal[index] = ''
        onChange(newVal)
      }
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').trim()
    const cleanText = text.replace(/\D/g, '').slice(0, 6)
    
    if (cleanText) {
      const newVal = [...value]
      for (let i = 0; i < 6; i++) {
        newVal[i] = cleanText[i] || ''
      }
      onChange(newVal)
      
      // Focus on last filled index or the next empty
      const nextFocusIdx = Math.min(cleanText.length, 5)
      inputRefs.current[nextFocusIdx]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center mb-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <input
          key={idx}
          ref={el => inputRefs.current[idx] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[idx] || ''}
          onChange={e => handleChange(idx, e.target.value)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={`w-11 h-14 text-center text-lg font-black font-display rounded-2xl border transition-all
            bg-dark-950/80 text-white outline-none focus:border-primary-400
            ${value[idx] 
              ? 'border-primary-500 shadow-md shadow-primary-500/10' 
              : 'border-white/5'
            }`}
        />
      ))}
    </div>
  )
}

export default OTPInput
