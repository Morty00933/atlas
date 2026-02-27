export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button className="pagination-btn" disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}>&larr; Назад</button>
      <span className="pagination-info">{currentPage} / {totalPages}</span>
      <button className="pagination-btn" disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}>Вперёд &rarr;</button>
    </div>
  );
}
