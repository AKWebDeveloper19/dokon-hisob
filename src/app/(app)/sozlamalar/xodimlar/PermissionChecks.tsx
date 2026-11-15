export function PermissionChecks(props: {
  defaults?: { can_discount?: boolean; can_refund?: boolean; can_write_off?: boolean; can_receive?: boolean };
}) {
  const d = props.defaults ?? {};
  return (
    <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 2 }}>
      <legend style={{ fontWeight: 550, fontSize: 14, marginBottom: 4 }}>Qo‘shimcha ruxsatlar</legend>
      <label className="check">
        <input type="checkbox" name="can_discount" defaultChecked={d.can_discount} /> Chegirma berish
      </label>
      <label className="check">
        <input type="checkbox" name="can_refund" defaultChecked={d.can_refund} /> Qaytim rasmiylashtirish
      </label>
      <label className="check">
        <input type="checkbox" name="can_write_off" defaultChecked={d.can_write_off} /> Hisobdan chiqarish
      </label>
      <label className="check">
        <input type="checkbox" name="can_receive" defaultChecked={d.can_receive} /> Kirim qilish
      </label>
      <span className="hint muted" style={{ fontSize: 13 }}>
        Kassir har doim sotuv qila oladi va sotuv narxi hamda qoldiqni ko‘radi. Tannarx va foyda kassirga ko‘rinmaydi.
      </span>
    </fieldset>
  );
}
