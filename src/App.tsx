import { useMemo, useState } from 'react';
import {
  MEASUREMENT_FIELDS,
  ORDER_STATUSES,
  type FabricPhoto,
  type MeasurementTemplate,
  type MeasurementValues,
  type Order,
  type OrderStatus,
  type StatusEvent
} from './types';
import {
  compressImage,
  countdownTone,
  countFilledMeasurements,
  daysUntil,
  formatDateTime,
  formatStatus,
  sortByDeadline,
  todayIso
} from './utils';

type OrderDraft = {
  customerName: string;
  phone: string;
  garmentType: string;
  notes: string;
  status: OrderStatus;
  fittingDate: string;
  pickupDate: string;
  measurements: MeasurementValues;
  fabricPhotos: FabricPhoto[];
};

const ORDERS_STORAGE_KEY = 'fundiflow_orders_v2';
const TEMPLATES_STORAGE_KEY = 'fundiflow_measurements_v1';

const emptyMeasurements = (): MeasurementValues =>
  MEASUREMENT_FIELDS.reduce<MeasurementValues>((acc, field) => {
    acc[field] = '';
    return acc;
  }, {});

const createDraft = (): OrderDraft => ({
  customerName: '',
  phone: '',
  garmentType: '',
  notes: '',
  status: 'queued',
  fittingDate: '',
  pickupDate: todayIso(),
  measurements: emptyMeasurements(),
  fabricPhotos: []
});

const loadOrders = (): Order[] => {
  const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as Order[];
  } catch {
    return [];
  }
};

const loadTemplates = (): MeasurementTemplate[] => {
  const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as MeasurementTemplate[];
  } catch {
    return [];
  }
};

const getValidationError = (draft: OrderDraft): string | null => {
  if (!draft.customerName.trim()) return 'Customer name is required.';
  if (!draft.phone.trim()) return 'Phone is required.';
  if (!draft.garmentType.trim()) return 'Garment type is required.';
  if (!draft.pickupDate) return 'Pickup date is required.';
  if (draft.fittingDate && draft.fittingDate > draft.pickupDate) {
    return 'Fitting date cannot be later than pickup date.';
  }

  return null;
};

export default function App() {
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>(loadTemplates);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<OrderDraft>(createDraft);
  const [formError, setFormError] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  const persistOrders = (next: Order[]) => {
    setOrders(next);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(next));
  };

  const persistTemplates = (next: MeasurementTemplate[]) => {
    setTemplates(next);
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(next));
  };

  const visibleOrders = useMemo(() => {
    const sorted = sortByDeadline(orders);
    return sorted.filter((order) => {
      if (filter !== 'all' && order.status !== filter) return false;
      const haystack = `${order.customerName} ${order.phone} ${order.garmentType}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    });
  }, [orders, filter, query]);

  const selectedOrder = orders.find((order) => order.id === selectedId) ?? null;

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => {
        const samePhone = draft.phone.trim() && template.phone === draft.phone.trim();
        const sameName =
          draft.customerName.trim() &&
          template.customerName.toLowerCase() === draft.customerName.trim().toLowerCase();
        return samePhone || sameName;
      }) ?? null,
    [templates, draft.phone, draft.customerName]
  );

  const saveTemplateFromDraft = () => {
    if (!draft.customerName.trim() || !draft.phone.trim()) {
      setFormError('Enter customer name and phone before saving reusable measurements.');
      return;
    }

    const nextTemplate: MeasurementTemplate = {
      customerName: draft.customerName.trim(),
      phone: draft.phone.trim(),
      updatedAt: new Date().toISOString(),
      measurements: draft.measurements
    };

    const existingIndex = templates.findIndex((template) => template.phone === nextTemplate.phone);

    if (existingIndex >= 0) {
      const next = [...templates];
      next[existingIndex] = nextTemplate;
      persistTemplates(next);
    } else {
      persistTemplates([nextTemplate, ...templates]);
    }

    setFormError('');
  };

  const applySelectedTemplate = () => {
    if (!selectedTemplate) return;
    setDraft((current) => ({
      ...current,
      measurements: selectedTemplate.measurements
    }));
  };

  const makeStatusEvent = (status: OrderStatus): StatusEvent => ({
    id: crypto.randomUUID(),
    status,
    changedAt: new Date().toISOString()
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = getValidationError(draft);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const now = new Date().toISOString();
    const newOrder: Order = {
      id: crypto.randomUUID(),
      customerName: draft.customerName.trim(),
      phone: draft.phone.trim(),
      garmentType: draft.garmentType.trim(),
      notes: draft.notes.trim(),
      status: draft.status,
      fittingDate: draft.fittingDate || undefined,
      pickupDate: draft.pickupDate,
      measurements: draft.measurements,
      fabricPhotos: draft.fabricPhotos,
      statusHistory: [makeStatusEvent(draft.status)],
      createdAt: now,
      updatedAt: now
    };

    persistOrders([newOrder, ...orders]);
    setDraft(createDraft());
    setSelectedId(newOrder.id);
    setFormError('');
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    persistOrders(
      orders.map((order) => {
        if (order.id !== id) return order;
        const shouldAppendHistory = order.status !== status;

        return {
          ...order,
          status,
          statusHistory: shouldAppendHistory ? [makeStatusEvent(status), ...order.statusHistory] : order.statusHistory,
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const updateDraftPhotoNote = (id: string, note: string) => {
    setDraft((current) => ({
      ...current,
      fabricPhotos: current.fabricPhotos.map((photo) => (photo.id === id ? { ...photo, note } : photo))
    }));
  };

  const onUploadPhoto = async (file: File) => {
    try {
      const imageData = await compressImage(file);
      setDraft((current) => ({
        ...current,
        fabricPhotos: [
          ...current.fabricPhotos,
          { id: crypto.randomUUID(), imageData, createdAt: new Date().toISOString(), note: '' }
        ]
      }));
      setUploadError('');
    } catch {
      setUploadError('Photo upload failed. Try a different image.');
    }
  };

  return (
    <div className="app-shell">
      <header>
        <h1>FundiFlow MVP</h1>
        <p>Mobile-first order board for tailoring shops.</p>
      </header>

      <section className="panel">
        <h2>Create Order</h2>
        <form onSubmit={handleSubmit} className="order-form">
          <input
            placeholder="Customer full name"
            value={draft.customerName}
            onChange={(event) => setDraft((d) => ({ ...d, customerName: event.target.value }))}
            required
          />
          <input
            placeholder="Phone"
            value={draft.phone}
            onChange={(event) => setDraft((d) => ({ ...d, phone: event.target.value }))}
            required
          />
          <input
            placeholder="Garment type"
            value={draft.garmentType}
            onChange={(event) => setDraft((d) => ({ ...d, garmentType: event.target.value }))}
            required
          />
          <textarea
            placeholder="Order notes (optional)"
            value={draft.notes}
            onChange={(event) => setDraft((d) => ({ ...d, notes: event.target.value }))}
          />

          <div className="date-grid">
            <label>
              Fitting date (optional)
              <input
                type="date"
                value={draft.fittingDate}
                onChange={(event) => setDraft((d) => ({ ...d, fittingDate: event.target.value }))}
              />
            </label>
            <label>
              Pickup date
              <input
                type="date"
                value={draft.pickupDate}
                onChange={(event) => setDraft((d) => ({ ...d, pickupDate: event.target.value }))}
                required
              />
            </label>
          </div>

          <label>
            Status
            <select
              value={draft.status}
              onChange={(event) => setDraft((d) => ({ ...d, status: event.target.value as OrderStatus }))}
            >
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>
          </label>

          <h3>Measurement Vault</h3>
          {selectedTemplate && (
            <div className="hint-row">
              <small>
                Saved measurements found for {selectedTemplate.customerName} (updated{' '}
                {formatDateTime(selectedTemplate.updatedAt)}).
              </small>
              <button type="button" className="secondary-button" onClick={applySelectedTemplate}>
                Copy into order
              </button>
            </div>
          )}
          <div className="measurement-grid">
            {MEASUREMENT_FIELDS.map((field) => (
              <label key={field}>
                {field}
                <input
                  value={draft.measurements[field]}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      measurements: {
                        ...current.measurements,
                        [field]: event.target.value
                      }
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="hint-row">
            <small>{countFilledMeasurements(draft.measurements)} measurements filled.</small>
            <button type="button" className="secondary-button" onClick={saveTemplateFromDraft}>
              Save reusable set
            </button>
          </div>

          <h3>Fabric Photos</h3>
          <label className="file-input">
            Capture / Upload image
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                await onUploadPhoto(file);
                event.target.value = '';
              }}
            />
          </label>

          {uploadError && <p className="error-text">{uploadError}</p>}

          {draft.fabricPhotos.length > 0 && (
            <div className="photo-list">
              {draft.fabricPhotos.map((photo) => (
                <div key={photo.id} className="photo-item">
                  <img src={photo.imageData} alt="Fabric sample" className="thumbnail" />
                  <small>Captured {formatDateTime(photo.createdAt)}</small>
                  <input
                    placeholder="Photo note (optional)"
                    value={photo.note ?? ''}
                    onChange={(event) => updateDraftPhotoNote(photo.id, event.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {formError && <p className="error-text">{formError}</p>}

          <button type="submit">Save order</button>
        </form>
      </section>

      <section className="panel">
        <div className="toolbar">
          <h2>Orders List</h2>
          <input
            placeholder="Search customer / phone / garment"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={filter} onChange={(event) => setFilter(event.target.value as OrderStatus | 'all')}>
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="list-grid">
          {visibleOrders.map((order) => {
            const days = daysUntil(order.pickupDate);
            const tone = countdownTone(days);
            return (
              <article
                key={order.id}
                className={`card ${selectedId === order.id ? 'card-selected' : ''}`}
                onClick={() => setSelectedId(order.id)}
              >
                <div className="card-row">
                  <strong>{order.customerName}</strong>
                  <span className={`badge ${tone}`}>
                    {days <= 0 ? 'Due / Overdue' : `${days} day${days === 1 ? '' : 's'} left`}
                  </span>
                </div>
                <p>{order.garmentType}</p>
                <small>
                  {order.phone} • Pickup {order.pickupDate}
                </small>
                <label>
                  Status
                  <select
                    value={order.status}
                    onChange={(event) => updateOrderStatus(order.id, event.target.value as OrderStatus)}
                    onClick={(event) => event.stopPropagation()}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>
              </article>
            );
          })}
          {visibleOrders.length === 0 && <p>No orders yet. Create one above.</p>}
        </div>
      </section>

      <section className="panel">
        <h2>Order Detail</h2>
        {!selectedOrder && <p>Select an order from the list to view full details.</p>}
        {selectedOrder && (
          <div className="detail-stack">
            <div>
              <h3>{selectedOrder.customerName}</h3>
              <p>
                {selectedOrder.garmentType} • {selectedOrder.phone}
              </p>
              <p>Pickup: {selectedOrder.pickupDate}</p>
              {selectedOrder.fittingDate && <p>Fitting: {selectedOrder.fittingDate}</p>}
              {selectedOrder.notes && <p>Notes: {selectedOrder.notes}</p>}
            </div>

            <div>
              <h4>Status Timeline</h4>
              <ul className="timeline-list">
                {selectedOrder.statusHistory.map((event) => (
                  <li key={event.id}>
                    <strong>{formatStatus(event.status)}</strong>
                    <small>{formatDateTime(event.changedAt)}</small>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Measurements</h4>
              <ul className="measurements-list">
                {Object.entries(selectedOrder.measurements)
                  .filter(([, value]) => value)
                  .map(([field, value]) => (
                    <li key={field}>
                      <span>{field}</span>
                      <strong>{value}</strong>
                    </li>
                  ))}
              </ul>
            </div>

            <div>
              <h4>Fabric gallery</h4>
              {selectedOrder.fabricPhotos.length === 0 ? (
                <p>No photos.</p>
              ) : (
                <div className="photo-list">
                  {selectedOrder.fabricPhotos.map((photo) => (
                    <div key={photo.id} className="photo-item">
                      <img src={photo.imageData} alt="Fabric" className="thumbnail" />
                      <small>Captured {formatDateTime(photo.createdAt)}</small>
                      {photo.note && <small>Note: {photo.note}</small>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
