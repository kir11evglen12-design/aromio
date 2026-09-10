import { useShop } from "../lib/shop";

export default function Toast() {
  const { toastMsg } = useShop();
  return (
    <div className={"toast" + (toastMsg ? " is-on" : "")} role="status" aria-live="polite">
      {toastMsg}
    </div>
  );
}
