import bpy

object = bpy.data.objects['Cube'].data

# Generate an empty sublist for every vertex
out = [[] for i in object.vertices]

for edge in object.edges:
    
	out[edge.vertices[0]].append(edge.vertices[1])
	out[edge.vertices[1]].append(edge.vertices[0])


save = open('C:/Users/Monty/Desktop/Data/THREE/Models/Terrain/edgeExport.txt', 'w')
save.write(str(out))
save.close()