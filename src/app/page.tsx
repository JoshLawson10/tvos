import AppIcon from "@/components/AppIcon";

export default function Home() {
  return (
    <div className="container display flex flex-col items-center justify-center min-h-screen py-2">
      <div className="dock display flex gap-4 p-4 bg-gray-800 rounded-lg w-fit justify-center">
        <AppIcon name="Finder" showNameOnHover={false} />
        <AppIcon name="Safari" showNameOnHover={false} />
        <AppIcon name="Mail" showNameOnHover={false} />
        <AppIcon name="Messages" showNameOnHover={false} />
        <AppIcon name="Calendar" showNameOnHover={false} />
      </div>
      <div className="app-library display grid grid-cols-5 gap-4 mt-8 w-fit justify-center">
        <AppIcon name="Finder" />
        <AppIcon name="Safari" />
        <AppIcon name="Mail" />
        <AppIcon name="Messages" />
        <AppIcon name="Calendar" />
        <AppIcon name="Finder" />
        <AppIcon name="Safari" />
        <AppIcon name="Mail" />
        <AppIcon name="Messages" />
        <AppIcon name="Calendar" />
        <AppIcon name="Finder" />
        <AppIcon name="Safari" />
        <AppIcon name="Mail" />
        <AppIcon name="Messages" />
        <AppIcon name="Calendar" />
        <AppIcon name="Finder" />
        <AppIcon name="Safari" />
        <AppIcon name="Mail" />
        <AppIcon name="Messages" />
        <AppIcon name="Calendar" />
      </div>
    </div>
  );
}
