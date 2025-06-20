import React from "react"

export default function VistaPreviaNotaDebitoPDF({ datosNota }) {
  const nroFacturaFormateado = datosNota.factura?.numero
    ? `001-001-${String(datosNota.factura.numero).padStart(7, "0")}`
    : "-"

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}>
      <div style={{ border: '2px solid black', padding: '10px', marginBottom: '10px', display: 'flex' }}>
        <div style={{ flex: 1, borderRight: '2px solid black', padding: '10px' }}>
          <h2 style={{ margin: '0', textAlign: 'center' }}>DISTRIBUIDORA 'LAS NI\u00d1AS'</h2>
          <p style={{ textAlign: 'center', margin: '5px 0' }}>de Victor Manuel Barreto Barrios</p>
          <p style={{ textAlign: 'center', margin: '5px 0' }}>ELABORACI\u00d3N DE COMIDAS Y PLATOS PREPARADOS</p>
          <p style={{ textAlign: 'center', margin: '5px 0' }}>COMERCIO AL POR MAYOR DE COMESTIBLES, EXCEPTO CARNES</p>
          <p style={{ textAlign: 'center', margin: '5px 0' }}>OTRAS ACTIVIDADES DE SERVICIOS PERSONALES N.C.P</p>
          <p style={{ textAlign: 'center', margin: '5px 0' }}>NATALICIO TALAVERA C/ TTE ROJAS NRO 277 - LUQUE</p>
          <p style={{ textAlign: 'center', margin: '5px 0' }}>TEL\u00c9FONO: (0993) 540-258</p>
        </div>
        <div style={{ width: '280px', padding: '10px' }}>
          <div style={{ border: '2px solid black', padding: '5px', textAlign: 'center' }}>
            <p><strong>TIMBRADO N\u00ba</strong></p>
            <p>12345678</p>
            <p><strong>R.U.C.</strong></p>
            <p>80012345-1</p>
            <p><strong>NOTA DE D\u00c9BITO</strong></p>
            <h3>N\u00ba {datosNota.nota?.numero}</h3>
            <p><strong>Fecha de Emisi\u00f3n:</strong> {new Date(datosNota.nota?.fecha).toLocaleDateString("es-PY")}</p>
          </div>
        </div>
      </div>

      <div style={{ border: '1px solid black', padding: '5px', marginBottom: '10px' }}>
        <p><strong>Cliente o Raz\u00f3n Social:</strong> {datosNota.factura?.cliente}</p>
        <p><strong>R.U.C.:</strong> {datosNota.factura?.ruc}</p>
        <p><strong>Factura Origen:</strong> {nroFacturaFormateado}</p>
        <p><strong>Motivo:</strong> {datosNota.nota?.motivo}</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px' }}>
        <thead>
          <tr>
            <th style={cellStyle}>Concepto</th>
            <th style={cellStyle}>Cantidad</th>
            <th style={cellStyle}>Precio Unit.</th>
            <th style={cellStyle}>Subtotal</th>
            <th style={cellStyle}>Impuesto</th>
            <th style={cellStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          {datosNota.detalles?.map((item, i) => (
            <tr key={i}>
              <td style={cellStyle}>{item.concepto}</td>
              <td style={cellStyle}>{item.cantidad}</td>
              <td style={cellStyle}>₲ {item.precioUnitario.toLocaleString("es-PY")}</td>
              <td style={cellStyle}>₲ {item.subtotal.toLocaleString("es-PY")}</td>
              <td style={cellStyle}>₲ {item.montoImpuesto.toLocaleString("es-PY")}</td>
              <td style={cellStyle}>₲ {item.totalItem.toLocaleString("es-PY")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ textAlign: 'right', border: '2px solid black', padding: '10px', backgroundColor: '#eee' }}>
        <h3>TOTAL: ₲ {datosNota.nota?.montoTotal.toLocaleString("es-PY")}</h3>
      </div>

      <div style={{ marginTop: '10px', padding: '10px', border: '1px solid black' }}>
        <p><strong>Observaciones:</strong> {datosNota.nota?.motivo || 'Sin observaciones'}</p>
      </div>
    </div>
  )
}

const cellStyle = {
  border: '1px solid black',
  padding: '4px',
  textAlign: 'center'
}
