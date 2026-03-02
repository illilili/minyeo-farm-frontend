"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminTabs from "@/components/AdminTabs";
import MarkdownEditor from "@/components/MarkdownEditor";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut, apiUploadImage } from "@/lib/api";
import { toProductStatusLabel } from "@/lib/labels";

type ProductStatus = "ON_SALE" | "SOLD_OUT" | "HIDDEN";

type Product = {
  id: number;
  name: string;
  price: number;
  status: ProductStatus;
  thumbnailUrl?: string;
  description?: string;
};

type ProductForm = {
  name: string;
  price: string;
  status: ProductStatus;
  thumbnailUrl: string;
  description: string;
};

const initialForm: ProductForm = {
  name: "",
  price: "",
  status: "ON_SALE",
  thumbnailUrl: "",
  description: ""
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    const data = await apiGet<Product[]>("/api/admin/products");
    setProducts(data);
  }

  useEffect(() => {
    refresh().catch((e: Error) => setError(e.message));
  }, []);

  function startEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      price: String(product.price),
      status: product.status,
      thumbnailUrl: product.thumbnailUrl ?? "",
      description: product.description ?? ""
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditing(null);
    setForm(initialForm);
  }

  async function uploadThumbnail(file: File) {
    setThumbnailUploading(true);
    setError("");
    try {
      const { url } = await apiUploadImage("/api/admin/media/upload", file);
      setForm((prev) => ({ ...prev, thumbnailUrl: url }));
      setMessage("썸네일 이미지가 업로드되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "썸네일 업로드에 실패했습니다.");
    } finally {
      setThumbnailUploading(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        status: form.status,
        thumbnailUrl: form.thumbnailUrl.trim() || null,
        description: form.description.trim() || null
      };

      if (editing) {
        await apiPut(`/api/admin/products/${editing.id}`, payload);
        setMessage("상품이 수정되었습니다.");
      } else {
        await apiPost("/api/admin/products", payload);
        setMessage("상품이 등록되었습니다.");
      }
      resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "상품 저장에 실패했습니다.");
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm("이 상품을 숨김 처리할까요?")) return;
    setMessage("");
    setError("");
    try {
      await apiDelete(`/api/admin/products/${id}`);
      setMessage("상품이 숨김 처리되었습니다.");
      if (editing?.id === id) resetForm();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "상품 숨김 처리에 실패했습니다.");
    }
  }

  async function changeProductStatus(id: number, status: ProductStatus, doneMessage: string) {
    setMessage("");
    setError("");
    try {
      await apiPatch(`/api/admin/products/${id}/status`, { status });
      setMessage(doneMessage);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "상품 상태 변경에 실패했습니다.");
    }
  }

  async function unhideProduct(id: number) {
    await changeProductStatus(id, "ON_SALE", "상품이 숨김 해제되었습니다.");
  }

  return (
    <section className="stack">
      <article className="card stack">
        <h2>상품 관리</h2>
        <AdminTabs />
      </article>

      <article className="card stack">
        <h3>{editing ? "상품 수정" : "상품 추가"}</h3>
        <form className="stack" onSubmit={saveProduct}>
          <label className="field">
            <span>상품명</span>
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              required
            />
          </label>
          <div className="form-row">
            <label className="field">
              <span>가격</span>
              <input
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>상태</span>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as ProductStatus }))}
              >
                <option value="ON_SALE">판매중</option>
                <option value="SOLD_OUT">품절</option>
                <option value="HIDDEN">비노출</option>
              </select>
            </label>
          </div>
          <label className="field">
            <span>썸네일 이미지</span>
            <input
              type="file"
              accept="image/*"
              disabled={thumbnailUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadThumbnail(file);
              }}
            />
            {thumbnailUploading && <small className="muted">업로드중...</small>}
            {form.thumbnailUrl && (
              <>
                <img src={form.thumbnailUrl} alt="썸네일 미리보기" className="admin-thumb-preview" />
                <small className="muted">{form.thumbnailUrl}</small>
              </>
            )}
          </label>
          <MarkdownEditor
            label="설명 (Markdown)"
            value={form.description}
            onChange={(next) => setForm((prev) => ({ ...prev, description: next }))}
            placeholder={"# 상품 설명\n\n상품 특징을 마크다운으로 작성하세요."}
            rows={12}
          />

          <div className="admin-actions">
            <button type="submit" className="btn-primary">
              {editing ? "수정 저장" : "상품 등록"}
            </button>
            {editing && (
              <button type="button" onClick={resetForm}>
                취소
              </button>
            )}
          </div>
        </form>
      </article>

      <article className="card stack">
        <h3>상품 목록</h3>
        {products.map((product) => (
          <div key={product.id} className="admin-item">
            <div>
              <strong>{product.name}</strong>
              <p className="muted">
                {product.price.toLocaleString()}원 | {toProductStatusLabel(product.status)}
              </p>
            </div>
            <div className="admin-actions">
              <button type="button" onClick={() => startEdit(product)}>
                수정
              </button>
              <button
                type="button"
                onClick={() =>
                  product.status === "SOLD_OUT"
                    ? changeProductStatus(product.id, "ON_SALE", "상품이 판매중으로 변경되었습니다.")
                    : changeProductStatus(product.id, "SOLD_OUT", "상품이 품절 처리되었습니다.")
                }
              >
                {product.status === "SOLD_OUT" ? "판매 재개" : "품절 처리"}
              </button>
              <button type="button" onClick={() => (product.status === "HIDDEN" ? unhideProduct(product.id) : deleteProduct(product.id))}>
                {product.status === "HIDDEN" ? "숨김 해제" : "숨김 처리"}
              </button>
            </div>
          </div>
        ))}
      </article>

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
