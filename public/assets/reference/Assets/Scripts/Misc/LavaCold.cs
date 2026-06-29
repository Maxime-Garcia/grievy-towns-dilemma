using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class LavaCold : MonoBehaviour
{
  PolygonCollider2D col;
  public GameObject coldLava;
    // Start is called before the first frame update
    void Start()
    {
      col = gameObject.GetComponent<PolygonCollider2D>();
    }

    // Update is called once per frame
    void Update()
    {
      // print(col.transform);
    }

    void OnTriggerEnter2D(Collider2D other)
    {
      // print(other);
      // print(other.name);
      // print(other.name);
        if (other.gameObject.name == "waterWall(Clone)")
        {
            Instantiate(coldLava, col.transform.position /*+ new Vector2(0.08f, 0.08f)*/, Quaternion.identity, gameObject.GetComponent<Transform>());

        }
    }
}
