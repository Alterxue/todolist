import { useState } from 'react';

function Calendar({ projects }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getProjectsForDate = (day) => {
    return projects.filter(project => {
      if (!project.dueDate) return false;
      const dueDate = new Date(project.dueDate);
      return dueDate.getDate() === day &&
             dueDate.getMonth() === currentDate.getMonth() &&
             dueDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      marginTop: '30px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <button
          onClick={previousMonth}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Previous
        </button>
        <h3 style={{ margin: '0', color: '#333' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button
          onClick={nextMonth}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Next →
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '10px',
        marginBottom: '10px'
      }}>
        {dayNames.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#666',
              fontSize: '12px',
              padding: '10px 0'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '10px'
      }}>
        {days.map((day, index) => {
          const projectsForDay = day ? getProjectsForDate(day) : [];
          const isToday = day && new Date().getDate() === day && 
                         new Date().getMonth() === currentDate.getMonth() &&
                         new Date().getFullYear() === currentDate.getFullYear();

          return (
            <div
              key={index}
              style={{
                minHeight: '100px',
                padding: '8px',
                border: day ? '1px solid #ddd' : 'none',
                borderRadius: '6px',
                background: isToday ? '#fff3cd' : day ? '#f9f9f9' : 'transparent',
                fontSize: '12px'
              }}
            >
              {day && (
                <>
                  <div style={{
                    fontWeight: 'bold',
                    color: isToday ? '#ff6b6b' : '#333',
                    marginBottom: '4px'
                  }}>
                    {day}
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    {projectsForDay.map(project => (
                      <div
                        key={project.id}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          padding: '2px 4px',
                          borderRadius: '3px',
                          fontSize: '10px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {project.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
