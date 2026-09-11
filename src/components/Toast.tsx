import { useShop } from "../lib/shop";

/**
 * One place in the shop where an action can be taken back. The bar counts
 * the four seconds down so the offer never disappears without warning.
 */
export default function Toast() {
  const { toastMsg, toastUndo, runUndo } = useShop();
  const on = !!toastMsg;

  return (
    <div className={"toast" + (on ? " is-on" : "") + (toastUndo ? " toast--undo" : "")}
         role="status" aria-live="polite">
      <span className="toast-text">{toastMsg}</span>
      {toastUndo && (
        <button className="toast-undo" onClick={runUndo}>Отменить</button>
      )}
      {toastUndo && <span className="toast-bar" key={toastMsg} aria-hidden><i /></span>}
    </div>
  );
}
