import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import ItemCard from './ItemCard'

function DraggableItemList({ items, onReorder, onDeleteRequest, onItemUpdated, viewMode }) {
  function handleDragEnd(result) {
    if (!result.destination) return // listenin dışına bırakıldıysa hiçbir şey yapma

    const reordered = Array.from(items)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)

    onReorder(reordered)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="items">
        {(provided) => (
          <div
            className={`item-list ${viewMode === 'list' ? 'list-view' : ''}`}
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.7 : 1
                    }}
                  >
                    <ItemCard
                      item={item}
                      onDeleteRequest={onDeleteRequest}
                      onItemUpdated={onItemUpdated}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default DraggableItemList