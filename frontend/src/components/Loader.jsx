export default function Loader() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        minHeight: 200,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "3px solid rgba(79,156,249,0.15)",
          borderTopColor: "var(--accent-blue)",
          animation: "spin 0.8s linear infinite",
        }}
      />
    </div>
  );
}