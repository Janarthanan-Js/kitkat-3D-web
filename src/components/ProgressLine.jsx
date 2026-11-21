export default function ProgressLine({ visible, fillRef }) {
  return (
    <div className={`progress-line${visible ? '' : ' is-hidden'}`} aria-hidden="true">
      <div className="progress-line-fill" ref={fillRef} />
    </div>
  );
}
