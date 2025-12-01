import BinImage from "@/assets/trash.png";

interface BinStatusProps {
  active: number;
  inactive: number;
  onShowActive?: () => void;
}


export function BinStatus({ active, inactive, onShowActive }: BinStatusProps) {
  return (
    <div className="p-4 rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {/* <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-300" /> */}
        <img src={BinImage} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        <h3 className="text-sm font-semibold">Bin Sensors</h3>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs font-medium">

        {/* ACTIVE CLICK → triggers map update */}
        <div
          onClick={onShowActive}
          className="p-2 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 
                     dark:border-green-700 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40"
        >
          <div className="text-green-700 dark:text-green-400">Active</div>
          <div className="text-lg font-bold text-green-700 dark:text-green-400">
            {active}
          </div>
        </div>

        {/* INACTIVE (Button optional) */}
        <div className="p-2 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
          <div className="text-red-700 dark:text-red-400">Inactive</div>
          <div className="text-lg font-bold text-red-700 dark:text-red-400">
            {inactive}
          </div>
        </div>
        <div className="p-2 rounded-md bg-yellow-50 dark:bg-red-900/20 border border-yellow-200 dark:border-yellow-700">
          <div className="text-yellow-700 dark:text-yellow-400">Total</div>
          <div className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
            {inactive}
          </div>
        </div>

      </div>
    </div>
  );
}
