type DonutChartProps = {
    cash: number
    debt: number
    assets: number
  }
  
  export default function DonutChart({ cash, debt, assets }: DonutChartProps) {
    const total = cash + debt + assets
    const radius = 50
    const stroke =30
    const circumference = 2 * Math.PI * radius
  
    const getStrokeDash = (value: number) => (circumference * value) / total
  
    // Segments: each with a start offset calculated from previous segments
    const segments = [
      {
        color: '#00bf62', // green
        value: cash,
        offset: 0,
      },
      {
        color: '#e00000', // red
        value: debt,
        offset: getStrokeDash(cash),
      },
      {
        color: '#3f90fc', // blue
        value: assets,
        offset: getStrokeDash(cash + debt),
      },
    ]
  
    return (
        <div className="">
<svg width="160" height="160" viewBox="0 0 160 160">
        {segments.map((segment, index) => (
          <circle
            key={index}
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={segment.color}
            strokeWidth={stroke}
            strokeDasharray={getStrokeDash(segment.value) + ' ' + circumference}
            strokeDashoffset={-segment.offset}
            transform="rotate(-90 80 80)"
          />
        ))}
      </svg>
        </div>
      
    )
  }
  