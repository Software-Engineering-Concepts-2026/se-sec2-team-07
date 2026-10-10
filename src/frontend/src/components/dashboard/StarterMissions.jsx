import { Link } from 'react-router-dom';
import { Icon } from '../UI';
export default function StarterMissions({ missions }) {
  return (
    <section className="panel">
      <div className="row between mission-heading">
        <h2>ภารกิจเริ่มต้น</h2>
        <span className="badge">
          {missions.filter((m) => m.done).length} / {missions.length}
        </span>
      </div>
      <div className="mission-list">
        {missions.map((mission, i) => (
          <Link
            className={mission.done ? 'mission done' : 'mission'}
            key={mission.to}
            to={mission.to}
          >
            <span className="mission-number">{mission.done ? '✓' : i + 1}</span>
            <div>
              <strong>{mission.title}</strong>
              <small>{mission.detail}</small>
            </div>
            <Icon name="arrow" />
          </Link>
        ))}
      </div>
    </section>
  );
}
