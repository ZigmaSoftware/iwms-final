
import type { FC, SVGProps } from "react";
import { Pencil, Trash2 } from "lucide-react";

export const PencilIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <Pencil className="h-4 w-4" strokeWidth={1.8} {...props} />
);

export const TrashBinIcon: FC<SVGProps<SVGSVGElement>> = (props) => (
  <Trash2 className="h-4 w-4" strokeWidth={1.8} {...props} />
);
