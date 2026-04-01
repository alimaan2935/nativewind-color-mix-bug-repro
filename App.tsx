import "./global.css";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white gap-8 p-8">
      <Text className="text-lg font-bold">
        NativeWind v5 color-mix Bug Repro
      </Text>

      {/* WORKS - semi-transparent red */}
      <View className="h-20 w-40 items-center justify-center bg-red-500/50">
        <Text className="font-bold text-white">bg-red-500/50</Text>
        <Text className="text-xs text-white">Works</Text>
      </View>

      {/* BROKEN - no background visible */}
      <View className="h-20 w-40 items-center justify-center bg-black/50">
        <Text className="font-bold">bg-black/50</Text>
        <Text className="text-xs">Broken - no bg</Text>
      </View>

      {/* WORKS - solid black */}
      <View className="h-20 w-40 items-center justify-center bg-black">
        <Text className="font-bold text-white">bg-black</Text>
        <Text className="text-xs text-white">Works</Text>
      </View>

      {/* WORKS - semi-transparent white border */}
      <View className="h-20 w-40 items-center justify-center border-4 border-white/50 bg-neutral-800">
        <Text className="font-bold text-white">border-white/50</Text>
        <Text className="text-xs text-white">Works</Text>
      </View>

      {/* WORKS - semi-transparent white bg on dark */}
      <View className="h-20 w-40 items-center justify-center bg-neutral-900">
        <View className="h-14 w-32 items-center justify-center bg-white/50">
          <Text className="font-bold text-white">bg-white/50</Text>
          <Text className="text-xs text-white">Works</Text>
        </View>
      </View>

      {/* Test border-black/50 */}
      <View className="h-20 w-40 items-center justify-center border-4 border-black/50 bg-white">
        <Text className="font-bold">border-black/50</Text>
        <Text className="text-xs">Works?</Text>
      </View>
    </View>
  );
}
