"use client";

import ProductDetailsCard from "@/features/products/components/ProductDetailsCard";
import ProductHeader from "@/features/products/components/ProductHeader";
import ProductHistoryCard from "@/features/products/components/ProductHistoryCard";
import ProductNamesCard from "@/features/products/components/ProductNamesCard";
import { useProductDetail } from "@/features/products/hooks/useProducts";
import { useDict } from "@/lib/lang/DictProvider";
import { useParams } from "next/navigation";

export default function Page() {
  const { id } = useParams();
  const { product, loading, update, toggleActive } = useProductDetail(id as string);
  const dict = useDict();

  if (loading || !product) return null;

  return (
    <div className="space-y-6 grow">

      <ProductHeader
        name={product.productNames[0]}
        createdAt={product.createdAt}
        updatedAt={product.updatedAt}
        active={product.active}
        onToggleActive={toggleActive}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <ProductDetailsCard
          product={product}
          update={update}
          dict={dict}
        />
        <div className="flex h-full flex-col gap-4 overflow-hidden">
          <ProductNamesCard
            names={product.productNames}

            onAdd={(name) =>
              update("productNames", [
                ...product.productNames,
                name,
              ])
            }

            onRemove={(index) =>
              update(
                "productNames",
                product.productNames.filter(
                  (_, i) => i !== index
                )
              )
            }

            onMakeDefault={(index) => {
              const target = product.productNames[index];

              if (!target) return;

              update("productNames", [
                target,
                ...product.productNames.filter(
                  (_, i) => i !== index
                ),
              ]);
            }}
          />
        </div>
        {/* TODO: ProductNamesCard */}
        {/* TODO: ChartCard */}

        <ProductHistoryCard productId={id as string} />

      </div>
    </div>
  );
}